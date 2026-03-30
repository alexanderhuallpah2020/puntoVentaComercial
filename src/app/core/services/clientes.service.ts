import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SearchClientesResponse,
  ClienteDetalleResponse,
  ClienteLocalResponse,
  SunatClienteResponse,
  CreateClienteRequest,
  UpdateClienteRequest,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private base = '/api/v1/clientes';

  search(opts: {
    nombreCliente?: string;
    numDocumento?: string;
    idPais?: number;
    idDocIdentidad?: number;
    page?: number;
    pageSize?: number;
  }): Observable<SearchClientesResponse> {
    let params = new HttpParams();
    if (opts.nombreCliente) params = params.set('nombreCliente', opts.nombreCliente);
    if (opts.numDocumento)  params = params.set('numDocumento',  opts.numDocumento);
    if (opts.idPais)        params = params.set('idPais',        opts.idPais);
    if (opts.idDocIdentidad) params = params.set('idDocIdentidad', opts.idDocIdentidad);
    params = params.set('page',     opts.page     ?? 1);
    params = params.set('pageSize', opts.pageSize ?? 10);
    return this.http.get<SearchClientesResponse>(this.base, { params });
  }

  getById(id: number): Observable<ClienteDetalleResponse> {
    return this.http.get<ClienteDetalleResponse>(`${this.base}/${id}`);
  }

  getAddresses(id: number): Observable<ClienteLocalResponse[]> {
    return this.http.get<ClienteLocalResponse[]>(`${this.base}/${id}/addresses`);
  }

  create(body: CreateClienteRequest): Observable<number> {
    return this.http.post<number>(this.base, body);
  }

  update(id: number, body: UpdateClienteRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, body);
  }

  lookupSunat(ruc: string): Observable<SunatClienteResponse> {
    return this.http.get<SunatClienteResponse>(`${this.base}/sunat/${ruc}`);
  }
}
