import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
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
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule,
  ],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private service = inject(PedidosService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);

  loading  = signal(false);
  items    = signal<PedidoListItem[]>([]);
  total    = signal(0);
  page     = signal(1);
  pageSize = signal(20);

  fechaDesde: Date = primerDiaMes();
  fechaHasta: Date = ultimoDiaMes();
  nombreCliente = '';
  estado = '';

  displayedColumns = ['numDoc', 'cliente', 'fechaPedido', 'fechaEntrega', 'estado', 'total', 'acciones'];

  // Computed paginator values
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  pageStart  = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  pageEnd    = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.page();
    const range: number[] = [];
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, cur + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  });

  ngOnInit() {
    this.buscar();
  }

  buscar(resetPage = true) {
    if (resetPage) this.page.set(1);
    this.loading.set(true);

    this.service.search({
      fechaDesde:    this.toIso(this.fechaDesde),
      fechaHasta:    this.toIso(this.fechaHasta),
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

  limpiarFiltros() {
    this.fechaDesde    = primerDiaMes();
    this.fechaHasta    = ultimoDiaMes();
    this.nombreCliente = '';
    this.estado        = '';
    this.buscar();
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.buscar(false);
  }

  onPageSizeChange(event: Event) {
    this.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.buscar();
  }

  countEstado(e: string): number {
    return this.items().filter(i => i.estado === e).length;
  }

  nuevo() {
    const ref = this.dialog.open(PedidosFormDialog, {
      width: '960px',
      maxHeight: '92vh',
      disableClose: true,
      panelClass: 'scop-dialog',
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  editar(item: PedidoListItem) {
    const ref = this.dialog.open(PedidosFormDialog, {
      width: '960px',
      maxHeight: '92vh',
      disableClose: true,
      panelClass: 'scop-dialog',
      data: { idPedido: item.idPedido },
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  anular(item: PedidoListItem) {
    if (!confirm(`¿Anular el pedido #${item.numDocumento ?? item.idPedido}?`)) return;
    this.loading.set(true);
    this.service.anular(item.idPedido).subscribe({
      next: () => {
        this.snack.open('Pedido anulado correctamente', 'OK', { duration: 3000 });
        this.buscar();
      },
      error: (err: any) => {
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
      panelClass: 'scop-dialog',
      data: { idPedido: item.idPedido, importeTotal: item.importeTotal },
    });
    ref.afterClosed().subscribe(idVenta => {
      if (idVenta) {
        this.snack.open(`✓ Venta creada — ID: ${idVenta}`, 'OK', { duration: 5000 });
        this.buscar();
      }
    });
  }

  estadoLabel(e: string): string {
    return ({ A: 'Activo', E: 'Anulado', U: 'Atendido' } as Record<string, string>)[e] ?? e;
  }

  private toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}

function primerDiaMes(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function ultimoDiaMes(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
