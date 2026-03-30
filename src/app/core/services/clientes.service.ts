import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchClientesResponse } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private base = '/api/v1/clientes';

  search(nombreCliente: string, pageSize = 10): Observable<SearchClientesResponse> {
    const params = new HttpParams()
      .set('nombreCliente', nombreCliente)
      .set('pageSize', pageSize);
    return this.http.get<SearchClientesResponse>(this.base, { params });
  }
}
