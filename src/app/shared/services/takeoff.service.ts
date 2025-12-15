import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TakeoffService {
  constructor(private http: HttpClient) {}

  saveOrder(form: any) {
    return this.http.post<any>(`/api/takeoff`, form);
  }

  updateOrder(form: any, id) {
    return this.http.post<any>(`/api/takeoff/${id}/update`, form);
  }

  finalizeOrder(form: any, id) {
    return this.http.post<any>(`/api/takeoff/${id}/finalize`, form);
  }

  backOrderToCarpentry(form: any, id) {
    return this.http.post<any>(`/api/takeoff/${id}/backOrderToCarpentry`, form);
  }

  getOrdersFromUser() {
    return this.http.get<any>(`/api/takeoff`);
  }

  listAllCarpentrys() {
    return this.http.get<any>(`/api/carpentry`);
  }

  detailOrder(id: any) {
    return this.http.get<any>(`/api/takeoff/${id}`);
  }

  findCarpentry(email) {
    return this.http.get<any>(`/api/takeoff/findCarpentryByEmail/${email}`);
  }

  generatePDF(id: any) {
    return this.http.get<any>(`/api/takeoff/${id}/generatePDF`);
  }

  uploadDeliveryPhoto(takeoffId: string, photo: File) {
    const formData = new FormData();
    formData.append('deliveryPhoto', photo);

    return this.http.post<any>(`/api/takeoff/${takeoffId}/delivery-photo`, formData);
  }

  updateTrimCarpenter(takeoffId: string, trimCarpenterId: string) {
    return this.http.patch<any>(`/api/takeoff/${takeoffId}/trim-carpenter`, { trimCarpenterId });
  }

  removeTrimCarpenter(takeoffId: string) {
    return this.http.delete<any>(`/api/takeoff/${takeoffId}/trim-carpenter`);
  }

  getTakeoffsForScheduling(scheduleType: string) {
    return this.http.get<any>(`/api/takeoff/for-scheduling?type=${scheduleType}`);
  }
}
