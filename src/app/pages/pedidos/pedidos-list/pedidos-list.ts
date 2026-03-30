import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PedidosService } from '../../../core/services/pedidos.service';
import { PedidoListItem } from '../../../core/models/pedido.model';
import { PedidosFormDialog } from '../pedidos-form-dialog/pedidos-form-dialog';
import { PedidosConvertirDialog } from '../pedidos-convertir-dialog/pedidos-convertir-dialog';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule,
  ],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private service = inject(PedidosService);
  private snack    = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  loading  = signal(false);
  items    = signal<PedidoListItem[]>([]);
  total    = signal(0);
  page     = signal(1);
  pageSize = signal(20);

  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;
  nombreCliente = '';
  estado = '';

  displayedColumns = ['numDoc', 'cliente', 'fechaPedido', 'fechaEntrega', 'estado', 'total', 'acciones'];

  ngOnInit() {
    this.buscar();
  }

  buscar(resetPage = true) {
    if (resetPage) this.page.set(1);
    this.loading.set(true);

    this.service.search({
      fechaDesde:    this.fechaDesde ? this.toIso(this.fechaDesde) : undefined,
      fechaHasta:    this.fechaHasta ? this.toIso(this.fechaHasta) : undefined,
      nombreCliente: this.nombreCliente || undefined,
      estado:        this.estado || undefined,
      page:          this.page(),
      pageSize:      this.pageSize(),
    }).subscribe({
      next: r => {
        this.items.set(r.items);
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Error al cargar pedidos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onPageChange(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.buscar(false);
  }

  nuevo() {
    const ref = this.dialog.open(PedidosFormDialog, {
      width: '950px',
      maxHeight: '92vh',
      disableClose: true,
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  editar(item: PedidoListItem) {
    const ref = this.dialog.open(PedidosFormDialog, {
      width: '950px',
      maxHeight: '92vh',
      disableClose: true,
      data: { idPedido: item.idPedido },
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  anular(item: PedidoListItem) {
    if (!confirm(`¿Anular el pedido #${item.numDocumento ?? item.idPedido}?`)) return;
    this.loading.set(true);
    this.service.anular(item.idPedido).subscribe({
      next: () => {
        this.snack.open('Pedido anulado', 'OK', { duration: 3000 });
        this.buscar();
      },
      error: err => {
        const msg = err?.error?.description ?? 'Error al anular el pedido';
        this.snack.open(msg, 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  convertir(item: PedidoListItem) {
    const ref = this.dialog.open(PedidosConvertirDialog, {
      width: '520px',
      disableClose: true,
      data: { idPedido: item.idPedido, importeTotal: item.importeTotal },
    });
    ref.afterClosed().subscribe(idVenta => {
      if (idVenta) {
        this.snack.open(`Venta creada — ID: ${idVenta}`, 'OK', { duration: 5000 });
        this.buscar();
      }
    });
  }

  estadoLabel(e: string): string {
    return ({ A: 'Activo', E: 'Anulado', U: 'Atendido' } as Record<string, string>)[e] ?? e;
  }

  estadoClass(e: string): string {
    return `estado-${e}`;
  }

  private toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
