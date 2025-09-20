export const MESSAGES = {
  ERROR: {
    DETAIL_TAKEOFF: 'Error loading takeoff details',
    GET_CARPENTRY: 'Error loading carpenters',
    SAVING_CARPENTER: 'Error saving carpenter assignment',
    SAVING_TRIM_CARPENTER: 'Error saving trim carpenter assignment',
    REMOVING_TRIM_CARPENTER: 'Error removing trim carpenter',
  },
  SUCCESS: {
    CARPENTER_SAVED: 'Carpenter assignment saved successfully',
    TRIM_CARPENTER_SAVED: 'Trim carpenter assignment saved successfully',
    TRIM_CARPENTER_REMOVED: 'Trim carpenter removed successfully',
  },
  INFO: {
    MEASUREMENT_CARPENTER_ASSIGNED: 'Measurement carpenter assigned. Changes will be saved automatically.',
    MEASUREMENT_CARPENTER_REMOVED: 'Measurement carpenter removed. Changes will be saved automatically.',
    TRIM_CARPENTER_ASSIGNED: 'Trim carpenter assigned. Changes will be saved automatically.',
    TRIM_CARPENTER_REMOVED: 'Trim carpenter removed. Changes will be saved automatically.',
    TAKEOFF_READONLY: 'This takeoff is completed and can no longer be edited.',
  },
  TITLE: {
    ATTENTION: 'Attention',
    ERROR: 'Error',
    SUCCESS: 'Success',
    CARPENTER_UPDATED: 'Carpenter Updated',
    READONLY_MODE: 'Read-only mode',
  }
} as const;

export const BREAKPOINTS = {
  MOBILE_MAX: 768,
} as const;