export interface PedidoDetalleItem {
  idArticulo: number;
  idUnidad: number;
  descripcionArticulo: string | null;
  cantidad: number;
  precioUnd: number;
  precioVenta: number;
  descuento: number;
  tipoDescuento: number;
  flagExonerado: boolean;
  flagRegalo: number | null;
  idLocacion: number | null;
}

export interface CreatePedidoRequest {
  idSucursal: number;
  idTipoDocumento: number;
  idCliente: number;
  idTipoCliente: number;
  idTrabajador: number;
  fechaPedido: string;
  fechaEntrega: string;
  idTipoMoneda: number;
  idFormaPago: number | null;
  valorAfecto: number;
  valorInafecto: number;
  valorExonerado: number;
  igv: number;
  importeTotal: number;
  descuentoTotal: number;
  descuentoDetalle: number;
  observaciones: string;
  ordenCompra: string;
  idTipoPedido: number;
  idLocacion: number | null;
  flagPrecio: number;
  flagIgvAfecto: boolean;
  detalles: PedidoDetalleItem[];
}

export interface PedidoListItem {
  idPedido: number;
  numSerie: number | null;
  numDocumento: number | null;
  clienteNombre: string;
  idTrabajador: number;
  fechaPedido: string;
  fechaEntrega: string | null;
  estado: string;
  importeTotal: number;
}

export interface SearchPedidosResponse {
  items: PedidoListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetPedidoByIdResponse {
  idPedido: number;
  idSucursal: number;
  idTipoDocumento: number;
  numSerie: number | null;
  numDocumento: number | null;
  idCliente: number;
  idTipoCliente: number;
  idTrabajador: number;
  estado: string;
  fechaPedido: string;
  fechaEntrega: string;
  idTipoMoneda: number;
  idFormaPago: number | null;
  valorAfecto: number;
  valorInafecto: number;
  valorExonerado: number;
  igv: number;
  importeTotal: number;
  descuentoTotal: number;
  descuentoDetalle: number;
  observaciones: string;
  ordenCompra: string;
  idTipoPedido: number;
  idLocacion: number | null;
  flagPrecio: number;
  flagIgvAfecto: boolean;
  detalles: PedidoDetalleResponse[];
}

export interface PedidoDetalleResponse {
  correlativo: number;
  idArticulo: number;
  idUnidad: number;
  descripcionArticulo: string | null;
  cantidad: number | null;
  precioUnd: number;
  precioVenta: number;
  valorVenta: number;
  descuento: number;
  tipoDescuento: number;
  flagExonerado: boolean;
  flagRegalo: number | null;
  idLocacion: number | null;
  estado: string;
}

export interface ConvertirVentaRequest {
  idTipoDocumento: number;
  numSerieA: string;
  idEstacionTrabajo: number;
  idSubdiario: number | null;
  tipoCambio: number;
  importePagado: number;
  importeVuelto: number;
  idFormaPago: number;
  pagos: ConvertirVentaPagoItem[];
  cuotas: ConvertirVentaCuotaItem[];
}

export interface ConvertirVentaPagoItem {
  idFormaPago: number;
  idTipoMoneda: number;
  importe: number;
}

export interface ConvertirVentaCuotaItem {
  fechaCuota: string | null;
  monto: number | null;
}
