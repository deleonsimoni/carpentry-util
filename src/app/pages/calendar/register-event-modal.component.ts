import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-register-event-modal',
   standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-event-modal.component.html'
})
export class RegisterEventModalComponent {
  @Input() date!: Date;

  takeoffs = ['Morning', 'Afternoon', 'Evening'];
  eventData = {
    takeoff: '',
    status: 'scheduled',
    notes: ''
  };

  constructor(public activeModal: NgbActiveModal) { }

  save() {
    if (!this.eventData.takeoff) return;
    this.activeModal.close({ ...this.eventData, date: this.date });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
