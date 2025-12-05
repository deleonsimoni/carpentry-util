import { TakeoffOrder } from './takeoff.interface';

export enum ScheduleEventType {
  FIRST_TRIM = 'first_trim',
  BACKTRIM = 'backtrim',
  DELIVERY = 'delivery'
}

export interface ScheduleEvent {
  _id?: string;
  takeoffIds: string[];
  type: ScheduleEventType;
  title: string;
  scheduledDate: string;
  assignedTo?: string;
  assignedToName?: string;
  takeoffs?: TakeoffOrder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleEventFormData {
  takeoffIds: string[];
  type: ScheduleEventType;
  title: string;
  scheduledDate: string;
  assignedTo?: string;
}

export interface ScheduleEventResponse {
  success: boolean;
  data?: ScheduleEvent | ScheduleEvent[];
  message?: string;
}

export const SCHEDULE_EVENT_TYPE_CONFIG: Record<ScheduleEventType, { label: string; color: string; icon: string }> = {
  [ScheduleEventType.FIRST_TRIM]: {
    label: 'First Trim',
    color: 'info',
    icon: 'fas fa-home'
  },
  [ScheduleEventType.BACKTRIM]: {
    label: 'Backtrim',
    color: 'success',
    icon: 'fas fa-clipboard-check'
  },
  [ScheduleEventType.DELIVERY]: {
    label: 'Delivery',
    color: 'warning',
    icon: 'fas fa-truck'
  }
};
