/* ── Catálogos locales ── */
export const TIPOS_DOC_VENTA: Record<number, string> = {
  1:  'Factura',
  3:  'Boleta',
  7:  'Guía Remisión',
  12: 'Ticket',
  13: 'Nota Débito',
  14: 'Nota Crédito',
};

export const FORMAS_PAGO: Record<number, string> = {
  1: 'Contado',
  2: 'Crédito',
  3: 'Tarjeta',
  4: 'Yape/Plin',
  5: 'Transferencia',
};

/* ── Search ── */
export interface VentaListItem {
  idVenta: number;
  idTipoDocumento: number;
  numSerieA: string | null;
  numeroDocumentoA: string | null;
  clienteNombre: string;
  vendedor: number;
  fechaEmision: string;
  estado: string;
  importeTotal: number;
}

export interface SearchVentasResponse {
  items: VentaListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/* ── GetById ── */
export interface VentaDetalleItem {
  correlativo: number;
  idArticulo: number | null;
  descripcionArticulo: string | null;
  cantidad: number | null;
  precioUnitario: number;
  importeDescuento: number;
  valorVenta: number;
  flagExonerado: boolean;
  idTipoAfectoIGV: number | null;
}

export interface VentaPagoItem {
  idFormaPago: number;
  idTipoMoneda: number;
  importe: number;
}

export interface VentaDetalleResponse {
  idVenta: number;
  idTipoDocumento: number;
  numSerie: number | null;
  numeroDocumento: number | null;
  numSerieA: string | null;
  numeroDocumentoA: string | null;
  idCliente: number;
  vendedor: number;
  fechaEmision: string;
  estado: string;
  idTipoMoneda: number;
  valorNeto: number;
  importeDescuento: number;
  valorVenta: number;
  igv: number;
  valorExonerado: number;
  isc: number | null;
  valorICBPER: number;
  importeTotal: number;
  importePagado: number | null;
  importeVuelto: number | null;
  detalles: VentaDetalleItem[];
  pagos: VentaPagoItem[];
}

/* ── Anular ── */
export interface AnularVentaRequest {
  motivoAnulacion: string | null;
}
