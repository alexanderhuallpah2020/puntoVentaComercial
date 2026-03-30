/* ── Catálogo de tipos de documento ── */
export const TIPOS_DOC: { id: number; label: string; codigo: string }[] = [
  { id: 1,  label: 'DNI',                 codigo: '1'  },
  { id: 6,  label: 'RUC',                 codigo: '6'  },
  { id: 4,  label: 'Carnet Extranjería',  codigo: '4'  },
  { id: 7,  label: 'Pasaporte',           codigo: '7'  },
  { id: 0,  label: 'Sin Documento',       codigo: '0'  },
];

/* ── Search ── */
export interface ClienteResumen {
  idCliente: number;
  nombre: string;
  numDocumento: string | null;
  tipoDocumento: string | null;
  direccionLocal: string | null;
  telefono1: string | null;
  estadoCliente: string;
}

export interface SearchClientesResponse {
  items: ClienteResumen[];
  total: number;
  page: number;
  pageSize: number;
}

/* ── GetById ── */
export interface ClienteLocalResponse {
  idClienteLocal: number;
  idSucursal: number;
  direccionLocal: string;
  telefono1: string | null;
  estado: string;
}

export interface ClienteDetalleResponse {
  idCliente: number;
  nombre: string;
  nombreComercial: string | null;
  idDocumentoIdentidad: number | null;
  numDocumento: string | null;
  codValidadorDoc: string | null;
  idPais: number;
  estadoCliente: string;
  esEditableDesdePos: boolean;
  clienteLocales: ClienteLocalResponse[];
}

/* ── SUNAT lookup ── */
export interface SunatClienteResponse {
  ruc: string;
  razonSocial: string;
  direccion: string | null;
}

/* ── Create request ── */
export interface CreateClienteRequest {
  nombre: string;
  idDocumentoIdentidad: number | null;
  numDocumento: string | null;
  codValidadorDoc: string | null;
  idPais: number;
  direccionLocal: string;
  telefono1: string | null;
  idSucursal: number;
  nombreComercial: string | null;
}

/* ── Update request ── */
export interface UpdateClienteRequest {
  nombre: string;
  idDocumentoIdentidad: number | null;
  numDocumento: string | null;
  codValidadorDoc: string | null;
  idPais: number;
  direccionLocal: string;
  telefono1: string | null;
}
