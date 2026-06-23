import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Vehiculo {
  id:         number;
  matricula:  string;
  marca?:     string;
  modelo?:    string;
  color?:     string;
  estado?:    boolean;
  ruta_id?:   number;
}

@Injectable({ providedIn: 'root' })
export class VehiculosService {
  private base = `${environment.apiUrl}/vehiculos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.base, {
      params: new HttpParams().set('estado', 'true').set('limit', '200'),
    });
  }
}