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
