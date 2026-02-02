import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TakeoffStatus,
  TakeoffStatusInfo,
  getStatusInfo,
  getNextStatuses,
  canChangeStatus
} from '../interfaces/takeoff-status.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TakeoffStatusService {
  constructor(private http: HttpClient) { }

  updateTakeoffStatus(takeoffId: string, newStatus: TakeoffStatus): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/takeoff/${takeoffId}/status`, { status: newStatus });
  }

  getStatusInfo(status: number): TakeoffStatusInfo {
    return getStatusInfo(status);
  }

  getNextStatuses(currentStatus: number): TakeoffStatusInfo[] {
    return getNextStatuses(currentStatus);
  }

  canChangeStatus(fromStatus: number, toStatus: number): boolean {
    return canChangeStatus(fromStatus, toStatus);
  }

  getStatusLabel(status: number): string {
    return getStatusInfo(status).label;
  }

  getStatusColor(status: number): string {
    return getStatusInfo(status).color;
  }

  getStatusIcon(status: number): string {
    return getStatusInfo(status).icon;
  }
}
