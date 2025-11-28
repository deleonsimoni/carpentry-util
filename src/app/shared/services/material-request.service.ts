import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MaterialRequestService {
  constructor(private http: HttpClient) { }

  save(form: any) {
    return this.http.post<any>(`/api/material-request`, form);
  }

  downloadPDF(id: any) {
    return this.http.get(`/api/material-request/pdf/${id}`, {
      observe: 'response',    // permite acessar headers
      responseType: 'blob'    // PDF binário
    });
  }


  getFromUser() {
    return this.http.get<any>(`/api/material-request`);
  }

  detail(id: any) {
    return this.http.get<any>(`/api/material-request/${id}`);
  }

  update(form: any, id) {
    return this.http.post<any>(`/api/material-request/${id}/update`, form);
  }

}
