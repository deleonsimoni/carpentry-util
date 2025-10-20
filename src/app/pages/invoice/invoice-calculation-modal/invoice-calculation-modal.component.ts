import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { InvoiceCalculationPreview } from '../../../shared/interfaces/invoice-calculation.interface';

@Component({
  selector: 'app-invoice-calculation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-calculation-modal.component.html',
  styleUrls: ['./invoice-calculation-modal.component.scss']
})
export class InvoiceCalculationModalComponent implements OnInit {
  @Input() calculationData!: InvoiceCalculationPreview;
  @Input() takeoffId!: string;

  isLoading = false;
  error: string | null = null;
  today = new Date();

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    console.log('🧮 Modal ngOnInit - calculationData:', this.calculationData);
    console.log('🧮 Modal ngOnInit - takeoffId:', this.takeoffId);

    if (!this.calculationData) {
      console.error('❌ No calculation data provided');
      this.error = 'No calculation data provided';
    } else {
      console.log('✅ Calculation data received:', {
        lineItems: this.calculationData.calculation?.lineItems?.length || 0,
        subtotal: this.calculationData.calculation?.subtotal,
        total: this.calculationData.calculation?.total
      });
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
