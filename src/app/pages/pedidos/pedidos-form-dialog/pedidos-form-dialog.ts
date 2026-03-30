import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { PedidosService } from '../../../core/services/pedidos.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { ClienteResumen } from '../../../core/models/cliente.model';
import { CreatePedidoRequest, PedidoDetalleItem } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-pedidos-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatCheckboxModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule, MatTooltipModule,
  ],
  templateUrl: './pedidos-form-dialog.html',
  styleUrl: './pedidos-form-dialog.scss',
})
export class PedidosFormDialog implements OnInit {
  private fb        = inject(FormBuilder);
  private service   = inject(PedidosService);
  private clientes  = inject(ClientesService);
  private snack     = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<PedidosFormDialog>);
  private data: { idPedido?: number } = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};

  loading    = signal(false);
  saving     = signal(false);
  clienteOpts = signal<ClienteResumen[]>([]);
  clienteSel = signal<ClienteResumen | null>(null);

  isEdit = false;

  form!: FormGroup;

  // Totals
  valorAfecto   = 0;
  valorExonerado = 0;
  igv           = 0;
  importeTotal  = 0;

  detalleCols = ['item', 'descripcion', 'cantidad', 'precioUnd', 'precioVenta', 'exonerado', 'acciones'];

  ngOnInit() {
    this.isEdit = !!this.data?.idPedido;
    this.buildForm();

    // Autocomplete cliente
    this.form.get('clienteNombre')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(val => {
        if (!val || val.length < 2) return of({ items: [] as ClienteResumen[] });
        return this.clientes.search({ nombreCliente: val, pageSize: 10 });
      }),
    ).subscribe(r => this.clienteOpts.set(r.items));

    if (this.isEdit) {
      this.cargarPedido(this.data.idPedido!);
    }
  }

  private buildForm() {
    const today = new Date();
    this.form = this.fb.group({
      idSucursal:       [1,       Validators.required],
      idTipoDocumento:  [29,      Validators.required],
      clienteNombre:    ['',      Validators.required],
      idCliente:        [null,    Validators.required],
      idTipoCliente:    [1,       Validators.required],
      idTrabajador:     [null,    Validators.required],
      fechaPedido:      [today,   Validators.required],
      fechaEntrega:     [today,   Validators.required],
      idTipoMoneda:     [1,       Validators.required],
      idFormaPago:      [1],
      flagIgvAfecto:    [true],
      observaciones:    [''],
      ordenCompra:      [''],
      detalles: this.fb.array([], { validators: control => control.value.length === 0 ? { minItems: true } : null }),
    });
  }

  get detallesArray(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  private buildDetalleGroup(d?: Partial<{
    idArticulo: number; idUnidad: number; descripcionArticulo: string;
    cantidad: number; precioUnd: number; precioVenta: number;
    descuento: number; flagExonerado: boolean;
  }>): FormGroup {
    return this.fb.group({
      idArticulo:          [d?.idArticulo ?? null,          Validators.required],
      idUnidad:            [d?.idUnidad ?? 1,               Validators.required],
      descripcionArticulo: [d?.descripcionArticulo ?? ''],
      cantidad:            [d?.cantidad ?? 1,               [Validators.required, Validators.min(0.0001)]],
      precioUnd:           [d?.precioUnd ?? 0,              [Validators.required, Validators.min(0)]],
      precioVenta:         [d?.precioVenta ?? 0],
      descuento:           [d?.descuento ?? 0],
      flagExonerado:       [d?.flagExonerado ?? false],
    });
  }

  agregarDetalle() {
    this.detallesArray.push(this.buildDetalleGroup());
    this.recalcular();
  }

  eliminarDetalle(i: number) {
    this.detallesArray.removeAt(i);
    this.recalcular();
  }

  onLineChange(i: number) {
    const g = this.detallesArray.at(i) as FormGroup;
    const cantidad   = +g.value.cantidad   || 0;
    const precioUnd  = +g.value.precioUnd  || 0;
    const descuento  = +g.value.descuento  || 0;
    const precioVenta = round2(cantidad * precioUnd - descuento);
    g.get('precioVenta')!.setValue(precioVenta, { emitEvent: false });
    this.recalcular();
  }

  recalcular() {
    const flagIgv = this.form.value.flagIgvAfecto as boolean;
    let baseAfecto = 0;
    let baseExonerado = 0;

    for (const g of this.detallesArray.controls) {
      const pv = +g.value.precioVenta || 0;
      if (g.value.flagExonerado) {
        baseExonerado += pv;
      } else {
        baseAfecto += pv;
      }
    }

    if (flagIgv) {
      // prices include IGV
      this.igv           = round2(baseAfecto - baseAfecto / 1.18);
      this.valorAfecto   = round2(baseAfecto / 1.18);
    } else {
      this.valorAfecto   = round2(baseAfecto);
      this.igv           = round2(baseAfecto * 0.18);
    }
    this.valorExonerado = round2(baseExonerado);
    this.importeTotal   = round2(this.valorAfecto + this.igv + this.valorExonerado);
  }

  selectCliente(c: ClienteResumen) {
    this.clienteSel.set(c);
    this.form.get('idCliente')!.setValue(c.idCliente);
    this.form.get('clienteNombre')!.setValue(c.nombre, { emitEvent: false });
  }

  displayCliente = (c: ClienteResumen | string | null): string => {
    if (!c) return '';
    if (typeof c === 'string') return c;
    return c.nombre;
  };

  private cargarPedido(id: number) {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: p => {
        this.form.patchValue({
          idSucursal:      p.idSucursal,
          idTipoDocumento: p.idTipoDocumento,
          idCliente:       p.idCliente,
          idTipoCliente:   p.idTipoCliente,
          idTrabajador:    p.idTrabajador,
          fechaPedido:     new Date(p.fechaPedido),
          fechaEntrega:    new Date(p.fechaEntrega),
          idTipoMoneda:    p.idTipoMoneda,
          idFormaPago:     p.idFormaPago,
          flagIgvAfecto:   p.flagIgvAfecto,
          observaciones:   p.observaciones,
          ordenCompra:     p.ordenCompra,
          clienteNombre:   '',   // filled below
        });

        // Load cliente name via search
        this.clientes.search({ pageSize: 1 }).subscribe();
        // Just set the name directly from data
        this.form.get('clienteNombre')!.setValue(`Cliente #${p.idCliente}`);

        this.detallesArray.clear();
        for (const d of p.detalles) {
          this.detallesArray.push(this.buildDetalleGroup({
            idArticulo:          d.idArticulo,
            idUnidad:            d.idUnidad,
            descripcionArticulo: d.descripcionArticulo ?? '',
            cantidad:            d.cantidad ?? 0,
            precioUnd:           d.precioUnd,
            precioVenta:         d.precioVenta,
            descuento:           d.descuento,
            flagExonerado:       d.flagExonerado,
          }));
        }
        this.recalcular();
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Error al cargar pedido', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  guardar() {
    if (this.form.invalid || this.detallesArray.length === 0) {
      this.form.markAllAsTouched();
      if (this.detallesArray.length === 0) {
        this.snack.open('Agregue al menos un ítem', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    const v = this.form.value;
    const body: CreatePedidoRequest = {
      idSucursal:       v.idSucursal,
      idTipoDocumento:  v.idTipoDocumento,
      idCliente:        v.idCliente,
      idTipoCliente:    v.idTipoCliente,
      idTrabajador:     v.idTrabajador,
      fechaPedido:      toIsoString(v.fechaPedido),
      fechaEntrega:     toIsoString(v.fechaEntrega),
      idTipoMoneda:     v.idTipoMoneda,
      idFormaPago:      v.idFormaPago ?? null,
      valorAfecto:      this.valorAfecto,
      valorInafecto:    0,
      valorExonerado:   this.valorExonerado,
      igv:              this.igv,
      importeTotal:     this.importeTotal,
      descuentoTotal:   0,
      descuentoDetalle: 0,
      observaciones:    v.observaciones ?? '',
      ordenCompra:      v.ordenCompra ?? '',
      idTipoPedido:     1,
      idLocacion:       null,
      flagPrecio:       1,
      flagIgvAfecto:    v.flagIgvAfecto ?? true,
      detalles: this.detallesArray.value.map((d: any): PedidoDetalleItem => ({
        idArticulo:          d.idArticulo,
        idUnidad:            d.idUnidad,
        descripcionArticulo: d.descripcionArticulo || null,
        cantidad:            +d.cantidad,
        precioUnd:           +d.precioUnd,
        precioVenta:         +d.precioVenta,
        descuento:           +d.descuento,
        tipoDescuento:       0,
        flagExonerado:       !!d.flagExonerado,
        flagRegalo:          null,
        idLocacion:          null,
      })),
    };

    const onSuccess = () => {
      this.snack.open(this.isEdit ? 'Pedido actualizado' : 'Pedido creado', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    };
    const onError = (err: any) => {
      const msg = err?.error?.description ?? 'Error al guardar';
      this.snack.open(msg, 'Cerrar', { duration: 4000 });
      this.saving.set(false);
    };

    this.saving.set(true);
    if (this.isEdit) {
      this.service.update(this.data.idPedido!, body).subscribe({ next: onSuccess, error: onError });
    } else {
      this.service.create(body).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toIsoString(d: Date | string): string {
  if (typeof d === 'string') return d;
  return d.toISOString();
}
