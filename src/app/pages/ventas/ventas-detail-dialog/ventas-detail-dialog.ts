import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { VentasService } from '../../../core/services/ventas.service';
import { VentaDetalleResponse, TIPOS_DOC_VENTA, FORMAS_PAGO } from '../../../core/models/venta.model';

@Component({
  selector: 'app-ventas-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule,
            MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './ventas-detail-dialog.html',
  styleUrl:    './ventas-detail-dialog.scss',
})
export class VentasDetailDialog implements OnInit {
  private service   = inject(VentasService);
  private snack     = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<VentasDetailDialog>);
  data: { idVenta: number } = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  venta   = signal<VentaDetalleResponse | null>(null);
  enviando = signal(false);

  ngOnInit() {
    this.service.getById(this.data.idVenta).subscribe({
      next: v  => { this.venta.set(v); this.loading.set(false); },
      error: () => { this.snack.open('Error al cargar detalle', 'Cerrar', { duration: 3000 }); this.loading.set(false); },
    });
  }

  enviarSunat() {
    const v = this.venta();
    if (!v) return;
    if (!confirm(`¿Enviar a SUNAT la venta ${this.nroDoc(v)}?`)) return;
    this.enviando.set(true);
    this.service.enviarSunat(v.idVenta).subscribe({
      next: () => {
        this.snack.open('Enviado a SUNAT correctamente', 'OK', { duration: 4000 });
        this.enviando.set(false);
      },
      error: (err: any) => {
        this.snack.open(err?.error?.description ?? 'Error al enviar a SUNAT', 'Cerrar', { duration: 5000 });
        this.enviando.set(false);
      },
    });
  }

  cerrar() { this.dialogRef.close(); }

  tipoDocLabel(id: number): string { return TIPOS_DOC_VENTA[id] ?? `Tipo ${id}`; }
  formaPagoLabel(id: number): string { return FORMAS_PAGO[id] ?? `Forma ${id}`; }
  estadoLabel(e: string): string { return e === 'A' ? 'Activa' : 'Anulada'; }

  nroDoc(v: VentaDetalleResponse): string {
    return v.numSerieA && v.numeroDocumentoA
      ? `${v.numSerieA}-${v.numeroDocumentoA}`
      : `#${v.idVenta}`;
  }

  igvPct(v: VentaDetalleResponse): number {
    return v.valorVenta > 0 ? Math.round((v.igv / v.valorVenta) * 100) : 0;
  }
}
