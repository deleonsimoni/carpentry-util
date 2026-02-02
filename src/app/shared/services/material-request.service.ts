import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MaterialRequestService {
  constructor(private http: HttpClient) { }

  save(form: any) {
    return this.http.post<any>(`${environment.apiUrl}/material-request`, form);
  }

  downloadPDF(id: any) {
    return this.http.get(`${environment.apiUrl}/material-request/pdf/${id}`, {
      observe: 'response',    // permite acessar headers
      responseType: 'blob'    // PDF binário
    });
  }


  getFromUser() {
    return this.http.get<any>(`${environment.apiUrl}/material-request`);
  }

  detail(id: any) {
    return this.http.get<any>(`${environment.apiUrl}/material-request/${id}`);
  }

  update(form: any, id) {
    return this.http.post<any>(`${environment.apiUrl}/material-request/${id}/update`, form);
  }

}
