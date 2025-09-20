import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-complete-measurement-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './complete-measurement-modal.component.html',
  styleUrl: './complete-measurement-modal.component.scss'
})
export class CompleteMeasurementModalComponent {
  @Input() customerName: string = '';
  @Input() takeoffId: string = '';
  @Input() isLoading: boolean = false;
  @Output() measurementCompleted = new EventEmitter<void>();

  constructor(public activeModal: NgbActiveModal) {}

  onCompleteClicked(): void {
    this.measurementCompleted.emit();
  }

  onCancelClicked(): void {
    this.activeModal.dismiss('cancel');
  }
}