import { TakeoffOrder } from './takeoff.interface';

export enum ScheduleEventType {
  TAKEOFF = 'takeoff',
  SHIPPING = 'shipping',
  TRIM = 'trim'
}

export enum ScheduleEventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ScheduleEvent {
  _id?: string;
  takeoffId: string;
  type: ScheduleEventType;
  title: string;
  scheduledDate: string;
  endDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: ScheduleEventStatus;
  notes?: string;
  location?: string;
  takeoff?: TakeoffOrder;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleEventFormData {
  takeoffId: string;
  type: ScheduleEventType;
  title: string;
  scheduledDate: string;
  endDate?: string;
  assignedTo?: string;
  status: ScheduleEventStatus;
  notes?: string;
  location?: string;
}

export interface ScheduleEventResponse {
  success: boolean;
  data?: ScheduleEvent | ScheduleEvent[];
  message?: string;
}

export const SCHEDULE_EVENT_TYPE_CONFIG: Record<ScheduleEventType, { label: string; color: string; icon: string }> = {
  [ScheduleEventType.TAKEOFF]: {
    label: 'Takeoff (Measurement)',
    color: 'info',
    icon: 'fas fa-ruler'
  },
  [ScheduleEventType.SHIPPING]: {
    label: 'Shipping',
    color: 'warning',
    icon: 'fas fa-truck'
  },
  [ScheduleEventType.TRIM]: {
    label: 'Trim',
    color: 'success',
    icon: 'fas fa-hammer'
  }
};

export const SCHEDULE_EVENT_STATUS_CONFIG: Record<ScheduleEventStatus, { label: string; color: string }> = {
  [ScheduleEventStatus.SCHEDULED]: {
    label: 'Scheduled',
    color: 'primary'
  },
  [ScheduleEventStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'info'
  },
  [ScheduleEventStatus.COMPLETED]: {
    label: 'Completed',
    color: 'success'
  },
  [ScheduleEventStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'secondary'
  }
};
