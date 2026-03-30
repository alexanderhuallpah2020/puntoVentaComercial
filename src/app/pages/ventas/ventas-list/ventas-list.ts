import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { VentasService } from '../../../core/services/ventas.service';
import { VentaListItem, TIPOS_DOC_VENTA } from '../../../core/models/venta.model';
import { VentasDetailDialog } from '../ventas-detail-dialog/ventas-detail-dialog';
import { VentasAnularDialog } from '../ventas-anular-dialog/ventas-anular-dialog';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule,
    MatDatepickerModule, MatInputModule, MatFormFieldModule,
  ],
  templateUrl: './ventas-list.html',
  styleUrl:    './ventas-list.scss',
})
export class VentasList implements OnInit {
  private service = inject(VentasService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);

  loading  = signal(false);
  items    = signal<VentaListItem[]>([]);
  total    = signal(0);
  page     = signal(1);
  pageSize = signal(10);

  fechaDesde:    Date = primerDiaMes();
  fechaHasta:    Date = ultimoDiaMes();
  nombreCliente  = '';
  numSerieA      = '';
  numDocumento   = '';
  idTipoDocumento: number | '' = '';
  estado         = '';

  tiposDoc = Object.entries(TIPOS_DOC_VENTA).map(([id, label]) => ({ id: +id, label }));

  totalPages  = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  pageStart   = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  pageEnd     = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  pageNumbers = computed(() => {
    const total = this.totalPages(), cur = this.page(), range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
    return range;
  });

  totalImporte = computed(() => this.items().reduce((s, i) => s + i.importeTotal, 0));
  countActivas  = computed(() => this.items().filter(i => i.estado === 'A').length);
  countAnuladas = computed(() => this.items().filter(i => i.estado === 'E').length);

  ngOnInit() { this.buscar(); }

  buscar(resetPage = true) {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.service.search({
      fechaDesde:      this.toIso(this.fechaDesde),
      fechaHasta:      this.toIso(this.fechaHasta),
      nombreCliente:   this.nombreCliente   || undefined,
      numSerieA:       this.numSerieA       || undefined,
      numDocumento:    this.numDocumento    ? +this.numDocumento : undefined,
      idTipoDocumento: this.idTipoDocumento || undefined,
      estado:          this.estado          || undefined,
      page:            this.page(),
      pageSize:        this.pageSize(),
    }).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => { this.snack.open('Error al cargar ventas', 'Cerrar', { duration: 3000 }); this.loading.set(false); },
    });
  }

  limpiar() {
    this.fechaDesde = primerDiaMes(); this.fechaHasta = ultimoDiaMes();
    this.nombreCliente = ''; this.numSerieA = ''; this.numDocumento = '';
    this.idTipoDocumento = ''; this.estado = '';
    this.buscar();
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p); this.buscar(false);
  }

  onPageSizeChange(e: Event) {
    this.pageSize.set(+(e.target as HTMLSelectElement).value); this.buscar();
  }

  verDetalle(item: VentaListItem) {
    this.dialog.open(VentasDetailDialog, {
      width: '820px', maxWidth: '98vw', maxHeight: '96vh',
      panelClass: 'scop-dialog',
      data: { idVenta: item.idVenta },
    });
  }

  anular(item: VentaListItem) {
    const ref = this.dialog.open(VentasAnularDialog, {
      width: '480px', maxWidth: '98vw',
      disableClose: true, panelClass: 'scop-dialog',
      data: { idVenta: item.idVenta, numDoc: this.nroDocLabel(item) },
    });
    ref.afterClosed().subscribe(ok => ok && this.buscar());
  }

  enviarSunat(item: VentaListItem) {
    if (!confirm(`¿Enviar a SUNAT la venta ${this.nroDocLabel(item)}?`)) return;
    this.loading.set(true);
    this.service.enviarSunat(item.idVenta).subscribe({
      next: () => { this.snack.open('Enviado a SUNAT correctamente', 'OK', { duration: 4000 }); this.loading.set(false); },
      error: (err: any) => {
        this.snack.open(err?.error?.description ?? 'Error al enviar a SUNAT', 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      },
    });
  }

  tipoDocLabel(id: number): string { return TIPOS_DOC_VENTA[id] ?? `Tipo ${id}`; }
  estadoLabel(e: string): string  { return e === 'A' ? 'Activa' : 'Anulada'; }
  nroDocLabel(v: VentaListItem): string {
    const serie = v.numSerieA ?? '';
    const nro   = v.numeroDocumentoA ?? '';
    return serie && nro ? `${serie}-${nro}` : `#${v.idVenta}`;
  }

  private toIso(d: Date): string { return d.toISOString().split('T')[0]; }
}

function primerDiaMes(): Date {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
}
function ultimoDiaMes(): Date {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
