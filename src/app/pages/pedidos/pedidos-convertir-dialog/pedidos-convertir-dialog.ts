import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PedidosService } from '../../../core/services/pedidos.service';
import { ConvertirVentaRequest } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-pedidos-convertir-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './pedidos-convertir-dialog.html',
  styleUrl: './pedidos-convertir-dialog.scss',
})
export class PedidosConvertirDialog implements OnInit {
  private fb        = inject(FormBuilder);
  private service   = inject(PedidosService);
  private snack     = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<PedidosConvertirDialog>);
  data: { idPedido: number; importeTotal: number } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      idTipoDocumento:   [1,           Validators.required],
      numSerieA:         ['F001',      Validators.required],
      idEstacionTrabajo: [1,           Validators.required],
      idSubdiario:       [null],
      tipoCambio:        [1,           [Validators.required, Validators.min(0.0001)]],
      importePagado:     [this.data.importeTotal, [Validators.required, Validators.min(0)]],
      importeVuelto:     [{ value: 0, disabled: true }],
      idFormaPago:       [1,           Validators.required],
    });

    this.form.get('importePagado')!.valueChanges.subscribe(v => {
      const vuelto = Math.max(0, (+v || 0) - this.data.importeTotal);
      this.form.get('importeVuelto')!.setValue(
        Math.round(vuelto * 100) / 100,
        { emitEvent: false }
      );
    });
  }

  convertir() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body: ConvertirVentaRequest = {
      idTipoDocumento:   v.idTipoDocumento,
      numSerieA:         v.numSerieA,
      idEstacionTrabajo: v.idEstacionTrabajo,
      idSubdiario:       v.idSubdiario ?? null,
      tipoCambio:        +v.tipoCambio,
      importePagado:     +v.importePagado,
      importeVuelto:     +v.importeVuelto,
      idFormaPago:       v.idFormaPago,
      pagos: [{
        idFormaPago:  v.idFormaPago,
        idTipoMoneda: 1,
        importe:      this.data.importeTotal,
      }],
      cuotas: [],
    };

    this.saving.set(true);
    this.service.convertirAVenta(this.data.idPedido, body).subscribe({
      next: idVenta => {
        this.dialogRef.close(idVenta);
      },
      error: err => {
        const msg = err?.error?.description ?? 'Error al convertir';
        this.snack.open(msg, 'Cerrar', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
