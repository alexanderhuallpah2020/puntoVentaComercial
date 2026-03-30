import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { VentasService } from '../../../core/services/ventas.service';

@Component({
  selector: 'app-ventas-anular-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './ventas-anular-dialog.html',
  styleUrl:    './ventas-anular-dialog.scss',
})
export class VentasAnularDialog {
  private service   = inject(VentasService);
  private snack     = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<VentasAnularDialog>);
  data: { idVenta: number; numDoc: string } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  motivo = '';

  confirmar() {
    this.saving.set(true);
    this.service.anular(this.data.idVenta, { motivoAnulacion: this.motivo || null }).subscribe({
      next: () => {
        this.snack.open('Venta anulada correctamente', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snack.open(err?.error?.description ?? 'Error al anular la venta', 'Cerrar', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  cancelar() { this.dialogRef.close(false); }
}
