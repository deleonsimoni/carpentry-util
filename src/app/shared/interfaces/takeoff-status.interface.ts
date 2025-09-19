export enum TakeoffStatus {
  CREATED = 1,          // Documento criado pela company (SEM carpinteiro associado)
  TO_MEASURE = 2,       // Enviado ao carpinteiro (COM carpinteiro associado) - STATUS INICIAL QUANDO CARPINTEIRO É ATRIBUÍDO
  UNDER_REVIEW = 3,     // Carpinteiro mediu e enviou para company
  READY_TO_SHIP = 4,    // Office aprovou e mandou para entrega
  SHIPPED = 5,          // Caminhão despachado
  TRIMMING_COMPLETED = 6, // Carpinteiro finalizou a instalação
  BACK_TRIM_COMPLETED = 7, // Parte final do carpinteiro, encerrando o serviço
  CLOSED = 8            // Companhia fecha o serviço
}

// TODO: BACKEND ADJUSTMENT NEEDED
// When a takeoff is created with carpenter assigned,
// the initial status should be TO_MEASURE (2), not CREATED (1)

// Status constants for better code readability
export const STATUS_CONSTANTS = {
  // Individual status values
  CREATED: TakeoffStatus.CREATED,
  TO_MEASURE: TakeoffStatus.TO_MEASURE,
  UNDER_REVIEW: TakeoffStatus.UNDER_REVIEW,
  READY_TO_SHIP: TakeoffStatus.READY_TO_SHIP,
  SHIPPED: TakeoffStatus.SHIPPED,
  TRIMMING_COMPLETED: TakeoffStatus.TRIMMING_COMPLETED,
  BACK_TRIM_COMPLETED: TakeoffStatus.BACK_TRIM_COMPLETED,
  CLOSED: TakeoffStatus.CLOSED,

  // Common status groups for business logic
  EDITABLE_STATUSES: [TakeoffStatus.CREATED],
  CARPENTER_READONLY_STATUSES: [TakeoffStatus.UNDER_REVIEW, TakeoffStatus.READY_TO_SHIP, TakeoffStatus.SHIPPED, TakeoffStatus.TRIMMING_COMPLETED, TakeoffStatus.BACK_TRIM_COMPLETED, TakeoffStatus.CLOSED], // Statuses where carpenter cannot edit
  COMPLETED_STATUSES: [TakeoffStatus.BACK_TRIM_COMPLETED, TakeoffStatus.CLOSED], // Final statuses

  // Helper functions
  isEditable: (status: number) => status === TakeoffStatus.CREATED,
  isCompleted: (status: number) => status >= TakeoffStatus.UNDER_REVIEW,
  isReadOnly: (status: number, isCompany: boolean) => !isCompany && status >= TakeoffStatus.UNDER_REVIEW,
  canSaveProgress: (status: number) => status === TakeoffStatus.CREATED,


  permissions: {
    // Company permissions
    company: {
      canEdit: (status: number) => status === TakeoffStatus.CREATED,
      canSaveProgress: (status: number) => status === TakeoffStatus.CREATED,
      canAdvanceStatus: (status: number) => [TakeoffStatus.CREATED, TakeoffStatus.UNDER_REVIEW, TakeoffStatus.READY_TO_SHIP, TakeoffStatus.SHIPPED, TakeoffStatus.TRIMMING_COMPLETED, TakeoffStatus.BACK_TRIM_COMPLETED].includes(status),
      canSendToCarpenter: (status: number) => status === TakeoffStatus.CREATED,
      canApproveReview: (status: number) => status === TakeoffStatus.UNDER_REVIEW,
      canMarkAsShipped: (status: number) => status === TakeoffStatus.READY_TO_SHIP,
      canCloseService: (status: number) => status === TakeoffStatus.BACK_TRIM_COMPLETED,
      canBackToCarpentry: (status: number) => status === TakeoffStatus.UNDER_REVIEW
    },

    carpenter: {
      canEdit: (status: number) => status === TakeoffStatus.TO_MEASURE,
      canSaveProgress: (status: number) => status === TakeoffStatus.TO_MEASURE,
      canAdvanceStatus: (status: number) => status === TakeoffStatus.TO_MEASURE,
      canStartMeasurement: (status: number) => status === TakeoffStatus.TO_MEASURE,
      canFinalizeMeasurement: (status: number) => status === TakeoffStatus.TO_MEASURE,
      // Carpenter cannot advance status in other phases - company controls installation flow
      canStartInstallation: (status: number) => false,
      canCompleteInstallation: (status: number) => false,
      canFinishService: (status: number) => false
    }
  },

  // Helper methods to check permissions
  can: {
    userEdit: (status: number, isCompany: boolean) =>
      isCompany ? STATUS_CONSTANTS.permissions.company.canEdit(status) : STATUS_CONSTANTS.permissions.carpenter.canEdit(status),

    userSaveProgress: (status: number, isCompany: boolean) =>
      isCompany ? STATUS_CONSTANTS.permissions.company.canSaveProgress(status) : STATUS_CONSTANTS.permissions.carpenter.canSaveProgress(status),

    userAdvanceStatus: (status: number, isCompany: boolean) =>
      isCompany ? STATUS_CONSTANTS.permissions.company.canAdvanceStatus(status) : STATUS_CONSTANTS.permissions.carpenter.canAdvanceStatus(status)
  }
} as const;

export interface TakeoffStatusInfo {
  id: TakeoffStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
  canChangeTo?: TakeoffStatus[];
}

export const TAKEOFF_STATUS_CONFIG: Record<TakeoffStatus, TakeoffStatusInfo> = {
  [TakeoffStatus.CREATED]: {
    id: TakeoffStatus.CREATED,
    label: 'Created',
    description: 'Documento criado pela company',
    color: 'secondary',
    icon: 'fas fa-file-plus',
    canChangeTo: [TakeoffStatus.TO_MEASURE]
  },
  [TakeoffStatus.TO_MEASURE]: {
    id: TakeoffStatus.TO_MEASURE,
    label: 'To Measure',
    description: 'Enviado ao carpinteiro',
    color: 'info',
    icon: 'fas fa-ruler',
    canChangeTo: [TakeoffStatus.UNDER_REVIEW]
  },
  [TakeoffStatus.UNDER_REVIEW]: {
    id: TakeoffStatus.UNDER_REVIEW,
    label: 'Under Review',
    description: 'Carpinteiro mediu e enviou para company',
    color: 'warning',
    icon: 'fas fa-search',
    canChangeTo: [TakeoffStatus.READY_TO_SHIP]
  },
  [TakeoffStatus.READY_TO_SHIP]: {
    id: TakeoffStatus.READY_TO_SHIP,
    label: 'Ready to Ship',
    description: 'Office aprovou e mandou para entrega',
    color: 'primary',
    icon: 'fas fa-check-circle',
    canChangeTo: [TakeoffStatus.SHIPPED]
  },
  [TakeoffStatus.SHIPPED]: {
    id: TakeoffStatus.SHIPPED,
    label: 'Shipped',
    description: 'Caminhão despachado',
    color: 'info',
    icon: 'fas fa-truck',
    canChangeTo: [TakeoffStatus.TRIMMING_COMPLETED]
  },
  [TakeoffStatus.TRIMMING_COMPLETED]: {
    id: TakeoffStatus.TRIMMING_COMPLETED,
    label: 'Trimming Completed',
    description: 'Carpinteiro finalizou a instalação',
    color: 'success',
    icon: 'fas fa-hammer',
    canChangeTo: [TakeoffStatus.BACK_TRIM_COMPLETED]
  },
  [TakeoffStatus.BACK_TRIM_COMPLETED]: {
    id: TakeoffStatus.BACK_TRIM_COMPLETED,
    label: 'Back Trim Completed',
    description: 'Parte final do carpinteiro, encerrando o serviço',
    color: 'success',
    icon: 'fas fa-tools',
    canChangeTo: [TakeoffStatus.CLOSED]
  },
  [TakeoffStatus.CLOSED]: {
    id: TakeoffStatus.CLOSED,
    label: 'Closed',
    description: 'Companhia fecha o serviço',
    color: 'dark',
    icon: 'fas fa-lock',
    canChangeTo: []
  }
};

export function getStatusInfo(status: number): TakeoffStatusInfo {
  return TAKEOFF_STATUS_CONFIG[status as TakeoffStatus] || TAKEOFF_STATUS_CONFIG[TakeoffStatus.CREATED];
}

export function getNextStatuses(currentStatus: number): TakeoffStatusInfo[] {
  const statusInfo = getStatusInfo(currentStatus);
  return statusInfo.canChangeTo?.map(status => getStatusInfo(status)) || [];
}

export function canChangeStatus(fromStatus: number, toStatus: number): boolean {
  const statusInfo = getStatusInfo(fromStatus);
  return statusInfo.canChangeTo?.includes(toStatus as TakeoffStatus) || false;
}
