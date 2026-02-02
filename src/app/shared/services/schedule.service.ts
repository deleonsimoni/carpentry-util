import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ScheduleEvent,
  ScheduleEventFormData,
  ScheduleEventResponse
} from '../interfaces/schedule.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly apiPath = `${environment.apiUrl}/schedule`;

  constructor(private http: HttpClient) {}

  getEvents(startDate?: string, endDate?: string): Observable<ScheduleEventResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<ScheduleEventResponse>(this.apiPath, { params });
  }

  getEventById(id: string): Observable<ScheduleEventResponse> {
    return this.http.get<ScheduleEventResponse>(`${this.apiPath}/${id}`);
  }

  getEventsByTakeoff(takeoffId: string): Observable<ScheduleEventResponse> {
    return this.http.get<ScheduleEventResponse>(`${this.apiPath}/takeoff/${takeoffId}`);
  }

  createEvent(event: ScheduleEventFormData): Observable<ScheduleEventResponse> {
    return this.http.post<ScheduleEventResponse>(this.apiPath, event);
  }

  updateEvent(id: string, event: Partial<ScheduleEventFormData>): Observable<ScheduleEventResponse> {
    return this.http.put<ScheduleEventResponse>(`${this.apiPath}/${id}`, event);
  }

  deleteEvent(id: string): Observable<ScheduleEventResponse> {
    return this.http.delete<ScheduleEventResponse>(`${this.apiPath}/${id}`);
  }
}
