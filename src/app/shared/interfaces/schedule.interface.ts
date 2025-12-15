import { TakeoffOrder } from './takeoff.interface';

export enum ScheduleEventType {
  PRODUCTION = 'production',
  SHIPPING = 'shipping',
  FIRST_TRIM = 'first_trim',
  SECOND_TRIM = 'second_trim'
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
  [ScheduleEventType.PRODUCTION]: {
    label: 'Production',
    color: 'primary',
    icon: 'fas fa-industry'
  },
  [ScheduleEventType.SHIPPING]: {
    label: 'Shipping',
    color: 'warning',
    icon: 'fas fa-truck'
  },
  [ScheduleEventType.FIRST_TRIM]: {
    label: 'First Trim',
    color: 'info',
    icon: 'fas fa-home'
  },
  [ScheduleEventType.SECOND_TRIM]: {
    label: 'Second Trim',
    color: 'success',
    icon: 'fas fa-clipboard-check'
  }
};
