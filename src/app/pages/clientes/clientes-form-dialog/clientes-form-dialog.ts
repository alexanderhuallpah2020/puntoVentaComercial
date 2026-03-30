import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClientesService } from '../../../core/services/clientes.service';
import {
  ClienteDetalleResponse,
  ClienteLocalResponse,
  TIPOS_DOC,
  CreateClienteRequest,
  UpdateClienteRequest,
} from '../../../core/models/cliente.model';

@Component({
  selector: 'app-clientes-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './clientes-form-dialog.html',
  styleUrl:    './clientes-form-dialog.scss',
})
export class ClientesFormDialog implements OnInit {
  private fb        = inject(FormBuilder);
  private service   = inject(ClientesService);
  private snack     = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ClientesFormDialog>);
  private data: { idCliente?: number } = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};

  loading    = signal(false);
  saving     = signal(false);
  lookingUp  = signal(false);

  isEdit           = false;
  noEditable       = false;
  clienteLocales   = signal<ClienteLocalResponse[]>([]);

  tiposDocs = TIPOS_DOC;

  form!: FormGroup;

  get esDni() { return this.form?.value.idDocumentoIdentidad === 1; }
  get esRuc() { return this.form?.value.idDocumentoIdentidad === 6; }

  ngOnInit() {
    this.isEdit = !!this.data?.idCliente;
    this.buildForm();
    if (this.isEdit) this.cargarCliente(this.data.idCliente!);
  }

  private buildForm() {
    this.form = this.fb.group({
      nombre:               ['', [Validators.required, Validators.maxLength(100)]],
      nombreComercial:      [''],
      idDocumentoIdentidad: [null as number | null],
      numDocumento:         [''],
      codValidadorDoc:      [''],
      idPais:               [1, Validators.required],
      direccionLocal:       ['', Validators.required],
      telefono1:            [''],
    });
  }

  private cargarCliente(id: number) {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (c: ClienteDetalleResponse) => {
        this.noEditable = !c.esEditableDesdePos;
        this.clienteLocales.set(c.clienteLocales);
        this.form.patchValue({
          nombre:               c.nombre,
          nombreComercial:      c.nombreComercial ?? '',
          idDocumentoIdentidad: c.idDocumentoIdentidad,
          numDocumento:         c.numDocumento ?? '',
          codValidadorDoc:      c.codValidadorDoc ?? '',
          idPais:               c.idPais,
          direccionLocal:       c.clienteLocales[0]?.direccionLocal ?? '',
          telefono1:            c.clienteLocales[0]?.telefono1 ?? '',
        });
        if (this.noEditable) this.form.disable();
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Error al cargar cliente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  buscarSunat() {
    const ruc = (this.form.value.numDocumento ?? '').trim();
    if (ruc.length !== 11) {
      this.snack.open('Ingrese un RUC de 11 dígitos', 'Cerrar', { duration: 2500 });
      return;
    }
    this.lookingUp.set(true);
    this.service.lookupSunat(ruc).subscribe({
      next: r => {
        this.form.patchValue({
          nombre:         r.razonSocial,
          direccionLocal: r.direccion ?? '',
        });
        this.lookingUp.set(false);
      },
      error: (err: any) => {
        const msg = err?.error?.description ?? 'No se encontró el RUC en SUNAT';
        this.snack.open(msg, 'Cerrar', { duration: 3500 });
        this.lookingUp.set(false);
      },
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    this.saving.set(true);

    if (this.isEdit) {
      const body: UpdateClienteRequest = {
        nombre:               v.nombre,
        idDocumentoIdentidad: v.idDocumentoIdentidad || null,
        numDocumento:         v.numDocumento || null,
        codValidadorDoc:      v.codValidadorDoc || null,
        idPais:               v.idPais,
        direccionLocal:       v.direccionLocal,
        telefono1:            v.telefono1 || null,
      };
      this.service.update(this.data.idCliente!, body).subscribe({
        next: () => {
          this.snack.open('Cliente actualizado', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.snack.open(err?.error?.description ?? 'Error al actualizar', 'Cerrar', { duration: 4000 });
          this.saving.set(false);
        },
      });
    } else {
      const body: CreateClienteRequest = {
        nombre:               v.nombre,
        idDocumentoIdentidad: v.idDocumentoIdentidad || null,
        numDocumento:         v.numDocumento || null,
        codValidadorDoc:      v.codValidadorDoc || null,
        idPais:               v.idPais,
        direccionLocal:       v.direccionLocal,
        telefono1:            v.telefono1 || null,
        idSucursal:           1,
        nombreComercial:      v.nombreComercial || null,
      };
      this.service.create(body).subscribe({
        next: () => {
          this.snack.open('Cliente creado correctamente', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.snack.open(err?.error?.description ?? 'Error al crear cliente', 'Cerrar', { duration: 4000 });
          this.saving.set(false);
        },
      });
    }
  }

  cancelar() { this.dialogRef.close(false); }
}
