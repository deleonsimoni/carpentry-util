import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private http: HttpClient
  ) { }

  saveOrder(form: any) {
    return this.http.post<any>(`/api/order`, form);
  }

  updateOrder(form: any, id) {
    return this.http.post<any>(`/api/order/${id}/update`, form);
  }

  finalizeOrder(form: any, id) {
    return this.http.post<any>(`/api/order/${id}/finalize`, form);
  }

  backOrderToCarpentry(form: any, id) {
    return this.http.post<any>(`/api/order/${id}/backOrderToCarpentry`, form);
  }

  getOrdersFromUser() {
    return this.http.get<any>(`/api/order`);
  }

  listAllCarpentrys() {
    return this.http.get<any>(`/api/carpentry`);
  }

  detailOrder(id: any) {
    return this.http.get<any>(`/api/order/${id}`);
  }

  findCarpentry(email) {
    return this.http.get<any>(`/api/order/findCarpentryByEmail/${email}`);
  }

  generatePDF(id: any) {
    return this.http.get<any>(`/api/order/${id}/generatePDF`);
  }

}
