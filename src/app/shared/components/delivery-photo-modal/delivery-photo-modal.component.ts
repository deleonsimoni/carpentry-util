import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-delivery-photo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-photo-modal.component.html',
  styleUrl: './delivery-photo-modal.component.scss'
})
export class DeliveryPhotoModalComponent {
  @Input() takeoffId: string = '';
  @Input() customerName: string = '';
  @Output() photoUploaded = new EventEmitter<File>();
  @Output() skipPhoto = new EventEmitter<void>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  dragOver = false;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NotificationService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notification.error('Please select an image file', 'Invalid File Type');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.notification.error('File size must be less than 5MB', 'File Too Large');
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  uploadPhoto(): void {
    if (!this.selectedFile) {
      this.notification.error('Please select a photo first', 'No Photo Selected');
      return;
    }

    this.isUploading = true;
    this.photoUploaded.emit(this.selectedFile);
  }

  completeUpload(): void {
    this.isUploading = false;
    this.activeModal.close();
  }

  uploadError(): void {
    this.isUploading = false;
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  skipPhotoUpload(): void {
    this.skipPhoto.emit();
    this.activeModal.close();
  }

  get canUpload(): boolean {
    return !!this.selectedFile && !this.isUploading;
  }
}