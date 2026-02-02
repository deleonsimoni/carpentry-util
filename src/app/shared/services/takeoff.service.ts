import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TakeoffService {
  constructor(private http: HttpClient) {}

  saveOrder(form: any) {
    return this.http.post<any>(`${environment.apiUrl}/takeoff`, form);
  }

  updateOrder(form: any, id) {
    return this.http.post<any>(`${environment.apiUrl}/takeoff/${id}/update`, form);
  }

  finalizeOrder(form: any, id) {
    return this.http.post<any>(`${environment.apiUrl}/takeoff/${id}/finalize`, form);
  }

  backOrderToCarpentry(form: any, id) {
    return this.http.post<any>(`${environment.apiUrl}/takeoff/${id}/backOrderToCarpentry`, form);
  }

  getOrdersFromUser() {
    return this.http.get<any>(`${environment.apiUrl}/takeoff`);
  }

  listAllCarpentrys() {
    return this.http.get<any>(`${environment.apiUrl}/carpentry`);
  }

  detailOrder(id: any) {
    return this.http.get<any>(`${environment.apiUrl}/takeoff/${id}`);
  }

  findCarpentry(email) {
    return this.http.get<any>(`${environment.apiUrl}/takeoff/findCarpentryByEmail/${email}`);
  }

  generatePDF(id: any) {
    return this.http.get<any>(`${environment.apiUrl}/takeoff/${id}/generatePDF`);
  }

  uploadDeliveryPhoto(takeoffId: string, photo: File) {
    const formData = new FormData();
    formData.append('deliveryPhoto', photo);

    return this.http.post<any>(`${environment.apiUrl}/takeoff/${takeoffId}/delivery-photo`, formData);
  }

  updateTrimCarpenter(takeoffId: string, trimCarpenterId: string) {
    return this.http.patch<any>(`${environment.apiUrl}/takeoff/${takeoffId}/trim-carpenter`, { trimCarpenterId });
  }

  removeTrimCarpenter(takeoffId: string) {
    return this.http.delete<any>(`${environment.apiUrl}/takeoff/${takeoffId}/trim-carpenter`);
  }

  getTakeoffsForScheduling(scheduleType: string) {
    return this.http.get<any>(`${environment.apiUrl}/takeoff/for-scheduling?type=${scheduleType}`);
  }
}
