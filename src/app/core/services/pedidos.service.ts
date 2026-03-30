import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreatePedidoRequest,
  ConvertirVentaRequest,
  GetPedidoByIdResponse,
  SearchPedidosResponse,
} from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private base = '/api/v1/pedidos';

  search(params: {
    idSucursal?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    nombreCliente?: string;
    numDocumento?: number;
    estado?: string;
    page?: number;
    pageSize?: number;
  }): Observable<SearchPedidosResponse> {
    let p = new HttpParams();
    if (params.idSucursal != null) p = p.set('idSucursal', params.idSucursal);
    if (params.fechaDesde)        p = p.set('fechaDesde', params.fechaDesde);
    if (params.fechaHasta)        p = p.set('fechaHasta', params.fechaHasta);
    if (params.nombreCliente)     p = p.set('nombreCliente', params.nombreCliente);
    if (params.numDocumento != null) p = p.set('numDocumento', params.numDocumento);
    if (params.estado)            p = p.set('estado', params.estado);
    p = p.set('page', params.page ?? 1);
    p = p.set('pageSize', params.pageSize ?? 10);
    return this.http.get<SearchPedidosResponse>(this.base, { params: p });
  }

  getById(id: number): Observable<GetPedidoByIdResponse> {
    return this.http.get<GetPedidoByIdResponse>(`${this.base}/${id}`);
  }

  create(body: CreatePedidoRequest): Observable<number> {
    return this.http.post<number>(this.base, body);
  }

  update(id: number, body: CreatePedidoRequest): Observable<boolean> {
    return this.http.put<boolean>(`${this.base}/${id}`, body);
  }

  anular(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.base}/${id}/anular`, {});
  }

  convertirAVenta(id: number, body: ConvertirVentaRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/${id}/convertir-venta`, body);
  }
}
