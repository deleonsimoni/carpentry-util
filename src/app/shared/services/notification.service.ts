import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: []
  };

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, title?: string): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      panelClass: ['success-snackbar']
    };

    const displayMessage = title ? `${title}: ${message}` : message;
    this.snackBar.open(displayMessage, '✓', config);
  }

  error(message: string, title?: string): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: 6000, // Longer duration for errors
      panelClass: ['error-snackbar']
    };

    const displayMessage = title ? `${title}: ${message}` : message;
    this.snackBar.open(displayMessage, '✕', config);
  }

  warning(message: string, title?: string): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      panelClass: ['warning-snackbar']
    };

    const displayMessage = title ? `${title}: ${message}` : message;
    this.snackBar.open(displayMessage, '⚠', config);
  }

  info(message: string, title?: string): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      panelClass: ['info-snackbar']
    };

    const displayMessage = title ? `${title}: ${message}` : message;
    this.snackBar.open(displayMessage, 'ℹ', config);
  }

  // Method to show a custom snackbar with action
  show(message: string, action?: string, config?: MatSnackBarConfig): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    this.snackBar.open(message, action, finalConfig);
  }
}