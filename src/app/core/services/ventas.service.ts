import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SearchVentasResponse,
  VentaDetalleResponse,
  AnularVentaRequest,
} from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private http = inject(HttpClient);
  private base = '/api/v1/ventas';

  search(opts: {
    fechaDesde?: string;
    fechaHasta?: string;
    nombreCliente?: string;
    numSerieA?: string;
    numDocumento?: number;
    idTipoDocumento?: number;
    estado?: string;
    page?: number;
    pageSize?: number;
  }): Observable<SearchVentasResponse> {
    let p = new HttpParams();
    if (opts.fechaDesde)      p = p.set('fechaDesde',      opts.fechaDesde);
    if (opts.fechaHasta)      p = p.set('fechaHasta',      opts.fechaHasta);
    if (opts.nombreCliente)   p = p.set('nombreCliente',   opts.nombreCliente);
    if (opts.numSerieA)       p = p.set('numSerieA',       opts.numSerieA);
    if (opts.numDocumento)    p = p.set('numDocumento',    opts.numDocumento);
    if (opts.idTipoDocumento) p = p.set('idTipoDocumento', opts.idTipoDocumento);
    if (opts.estado)          p = p.set('estado',          opts.estado);
    p = p.set('page',     opts.page     ?? 1);
    p = p.set('pageSize', opts.pageSize ?? 10);
    return this.http.get<SearchVentasResponse>(this.base, { params: p });
  }

  getById(id: number): Observable<VentaDetalleResponse> {
    return this.http.get<VentaDetalleResponse>(`${this.base}/${id}`);
  }

  anular(id: number, body: AnularVentaRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/anular`, body);
  }

  enviarSunat(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/enviar-sunat`, {});
  }
}
