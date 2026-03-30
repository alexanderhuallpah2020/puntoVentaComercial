import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClientesService } from '../../../core/services/clientes.service';
import { ClienteResumen, TIPOS_DOC } from '../../../core/models/cliente.model';
import { ClientesFormDialog } from '../clientes-form-dialog/clientes-form-dialog';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule,
  ],
  templateUrl: './clientes-list.html',
  styleUrl:    './clientes-list.scss',
})
export class ClientesList implements OnInit {
  private service = inject(ClientesService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);

  loading  = signal(false);
  items    = signal<ClienteResumen[]>([]);
  total    = signal(0);
  page     = signal(1);
  pageSize = signal(20);

  // Filter fields
  nombreCliente = '';
  numDocumento  = '';
  idDocIdentidad: number | '' = '';

  tiposDocs = TIPOS_DOC.filter(t => t.id !== 0);

  totalPages  = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  pageStart   = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  pageEnd     = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.page();
    const range: number[] = [];
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, cur + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  });

  countEstado(e: string) { return this.items().filter(i => i.estadoCliente === e).length; }

  ngOnInit() { this.buscar(); }

  buscar(resetPage = true) {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.service.search({
      nombreCliente:  this.nombreCliente  || undefined,
      numDocumento:   this.numDocumento   || undefined,
      idDocIdentidad: this.idDocIdentidad || undefined,
      page:           this.page(),
      pageSize:       this.pageSize(),
    }).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => { this.snack.open('Error al cargar clientes', 'Cerrar', { duration: 3000 }); this.loading.set(false); },
    });
  }

  limpiar() {
    this.nombreCliente = '';
    this.numDocumento  = '';
    this.idDocIdentidad = '';
    this.buscar();
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.buscar(false);
  }

  onPageSizeChange(e: Event) {
    this.pageSize.set(+(e.target as HTMLSelectElement).value);
    this.buscar();
  }

  nuevo() {
    const ref = this.dialog.open(ClientesFormDialog, {
      width: '680px', maxWidth: '98vw', maxHeight: '96vh',
      disableClose: true, panelClass: 'scop-dialog',
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  editar(item: ClienteResumen) {
    const ref = this.dialog.open(ClientesFormDialog, {
      width: '680px', maxWidth: '98vw', maxHeight: '96vh',
      disableClose: true, panelClass: 'scop-dialog',
      data: { idCliente: item.idCliente },
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  estadoLabel(e: string): string {
    return e === 'A' ? 'Activo' : 'Inactivo';
  }

  tipoDocLabel(codigo: string | null): string {
    if (!codigo) return '—';
    const t = TIPOS_DOC.find(x => x.codigo === codigo);
    return t ? t.label : codigo;
  }

  avatarLetras(nombre: string): string {
    return nombre.trim().split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
