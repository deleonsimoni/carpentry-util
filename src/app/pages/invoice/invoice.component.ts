import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbNavModule, NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InvoiceService } from '../../shared/services/invoice.service';
import { Invoice, TakeoffForInvoice, InvoiceGroup } from '../../shared/interfaces/invoice.interface';
import { InvoiceCalculationModalComponent } from './invoice-calculation-modal/invoice-calculation-modal.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbNavModule, NgbModalModule],
  templateUrl: './invoice-english.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  activeTab = 'takeoffs';

  // Takeoffs tab
  availableTakeoffs: TakeoffForInvoice[] = [];
  selectedTakeoffs: TakeoffForInvoice[] = [];
  isLoadingTakeoffs = false;

  // Current invoices tab
  currentInvoices: Invoice[] = [];
  isLoadingCurrent = false;

  // History tab
  invoiceHistory: InvoiceGroup[] = [];
  filteredInvoiceHistory: InvoiceGroup[] = [];
  isLoadingHistory = false;
  lotFilter = '';

  // Selection state
  selectAll = false;
  maxSelectionReached = false;

  constructor(
    private invoiceService: InvoiceService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTakeoffsForInvoice();
    this.loadInvoiceHistory();
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;

    switch(tabId) {
      case 'takeoffs':
        if (this.availableTakeoffs.length === 0) {
          this.loadTakeoffsForInvoice();
        }
        break;
      case 'current':
        if (this.currentInvoices.length === 0) {
          this.loadCurrentInvoices();
        }
        break;
      case 'history':
        if (this.invoiceHistory.length === 0) {
          this.loadInvoiceHistory();
        }
        break;
    }
  }

  loadTakeoffsForInvoice(): void {
    console.log('📋 Loading takeoffs for invoice...');
    this.isLoadingTakeoffs = true;
    this.invoiceService.getTakeoffsForInvoice().subscribe({
      next: (response) => {
        console.log('✅ Response received:', response);
        if (response.success) {
          this.availableTakeoffs = response.data.map((takeoff: any) => ({
            ...takeoff,
            selected: false
          }));
          console.log('📊 Available takeoffs:', this.availableTakeoffs.length);
        } else {
          console.warn('⚠️ Response success is false');
        }
        this.isLoadingTakeoffs = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar takeoffs:', error);
        console.error('Error details:', error.error);
        console.error('Error status:', error.status);
        this.isLoadingTakeoffs = false;
      }
    });
  }

  loadCurrentInvoices(): void {
    this.isLoadingCurrent = true;
    this.invoiceService.getCurrentInvoices().subscribe({
      next: (response) => {
        if (response.success) {
          this.currentInvoices = response.data;
        }
        this.isLoadingCurrent = false;
      },
      error: (error) => {
        console.error('Erro ao carregar invoices atuais:', error);
        this.isLoadingCurrent = false;
      }
    });
  }

  loadInvoiceHistory(): void {
    this.isLoadingHistory = true;
    this.invoiceService.getInvoiceHistory().subscribe({
      next: (response) => {
        if (response.success) {
          this.invoiceHistory = response.data;
          this.applyLotFilter();
        }
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
        this.isLoadingHistory = false;
      }
    });
  }

  onLotFilterChange(): void {
    this.applyLotFilter();
  }

  clearLotFilter(): void {
    this.lotFilter = '';
    this.applyLotFilter();
  }

  applyLotFilter(): void {
    if (!this.lotFilter || this.lotFilter.trim() === '') {
      this.filteredInvoiceHistory = this.invoiceHistory;
      return;
    }

    const filterLower = this.lotFilter.toLowerCase().trim();

    this.filteredInvoiceHistory = this.invoiceHistory.filter(invoice => {
      // Check if any takeoff in this invoice has a lot number that matches the filter
      return invoice.takeoffs.some(takeoff =>
        takeoff.lot?.toLowerCase().includes(filterLower)
      );
    });
  }

  onTakeoffSelection(takeoff: TakeoffForInvoice): void {
    // If trying to select (checkbox is now checked) and already have 5 selected
    if (takeoff.selected) {
      const currentSelected = this.availableTakeoffs.filter(t => t.selected).length;

      if (currentSelected > 5) {
        // Revert the selection
        takeoff.selected = false;
        this.maxSelectionReached = true;
        setTimeout(() => this.maxSelectionReached = false, 3000);
        return;
      }
    }

    this.updateSelectedTakeoffs();
    this.updateSelectAllState();
  }

  onSelectAll(): void {
    const currentSelected = this.availableTakeoffs.filter(t => t.selected).length;

    if (this.selectAll) {
      // Select all (up to 5)
      let selected = 0;
      this.availableTakeoffs.forEach(takeoff => {
        if (selected < 5) {
          takeoff.selected = true;
          selected++;
        } else {
          takeoff.selected = false;
        }
      });
    } else {
      // Deselect all
      this.availableTakeoffs.forEach(takeoff => {
        takeoff.selected = false;
      });
    }

    this.updateSelectedTakeoffs();
  }

  updateSelectedTakeoffs(): void {
    this.selectedTakeoffs = this.availableTakeoffs.filter(t => t.selected);
  }

  updateSelectAllState(): void {
    const selectedCount = this.availableTakeoffs.filter(t => t.selected).length;
    this.selectAll = selectedCount > 0 && selectedCount === Math.min(this.availableTakeoffs.length, 5);
  }

  generateInvoice(): void {
    if (this.selectedTakeoffs.length === 0) {
      this.toastr.warning('Please select at least one takeoff to generate an invoice', 'No Selection');
      return;
    }

    if (this.selectedTakeoffs.length > 5) {
      this.toastr.error('Maximum 5 takeoffs can be selected per invoice', 'Too Many Selected');
      return;
    }

    const takeoffIds = this.selectedTakeoffs.map(t => t._id);

    this.spinner.show();

    this.invoiceService.generateMultiTakeoffInvoicePDF(takeoffIds).subscribe({
      next: (response) => {
        this.spinner.hide();

        if (response.success && response.data.pdf) {
          // Create download link for PDF
          const link = document.createElement('a');
          link.href = response.data.pdf;
          link.download = `invoice_multi_takeoff_${new Date().getTime()}.pdf`;
          link.click();

          this.toastr.success(
            `Invoice ${response.data.invoiceNumber} generated successfully with ${response.data.takeoffCount} takeoff(s). Total: $${response.data.totalAmount.toFixed(2)}`,
            'Success'
          );

          this.clearSelection();
          this.loadTakeoffsForInvoice();
          this.loadInvoiceHistory(); // Reload history to show the new invoice
        } else {
          this.toastr.error('Failed to generate invoice PDF', 'Error');
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error generating invoice:', error);
        this.toastr.error(
          error.error?.message || 'Failed to generate invoice. Please try again.',
          'Error'
        );
      }
    });
  }

  clearSelection(): void {
    this.availableTakeoffs.forEach(takeoff => {
      takeoff.selected = false;
    });
    this.selectedTakeoffs = [];
    this.selectAll = false;
  }

  getTotalSelectedValue(): number {
    return this.selectedTakeoffs.reduce((total, takeoff) => total + takeoff.totalValue, 0);
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'draft': return 'badge-secondary';
      case 'issued': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'draft': return 'Draft';
      case 'issued': return 'Issued';
      default: return status;
    }
  }

  deleteInvoice(invoice: Invoice): void {
    if (confirm(`Tem certeza que deseja excluir a invoice ${invoice.invoiceNumber}?`)) {
      this.invoiceService.deleteInvoice(invoice._id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCurrentInvoices();
            this.loadTakeoffsForInvoice(); // Reload to show takeoffs available again
          }
        },
        error: (error) => {
          console.error('Erro ao excluir invoice:', error);
          alert('Erro ao excluir invoice. Tente novamente.');
        }
      });
    }
  }

  trackByTakeoffId(index: number, takeoff: TakeoffForInvoice): string {
    return takeoff._id;
  }

  // PDF generation method
  generatePDF(invoiceGroup: Invoice): void {
    // TODO: Implement PDF generation logic
    console.log('Generating PDF for invoice:', invoiceGroup.invoiceNumber);
    alert(`PDF generation for invoice ${invoiceGroup.invoiceNumber} will be implemented soon.`);
  }

  // View invoice details method
  viewInvoiceDetails(invoiceGroup: Invoice): void {
    // TODO: Implement view details logic (could open modal or navigate to details page)
    console.log('Viewing details for invoice:', invoiceGroup.invoiceNumber);
    alert(`Details view for invoice ${invoiceGroup.invoiceNumber} will be implemented soon.`);
  }

  // Tab navigation methods
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;

    if (tabId === 'history' && this.invoiceHistory.length === 0) {
      this.loadInvoiceHistory();
    }
  }

  // Helper methods for invoice history
  getUniqueCustomers(takeoffs: any[]): string[] {
    const customers = takeoffs.map(t => t.customerName);
    return Array.from(new Set(customers));
  }

  // Download invoice PDF from history
  downloadInvoiceFromHistory(invoiceGroup: Invoice): void {
    this.spinner.show();

    this.invoiceService.downloadInvoiceById(invoiceGroup._id!).subscribe({
      next: (response) => {
        this.spinner.hide();

        if (response.success && response.data.pdf) {
          // Create download link
          const link = document.createElement('a');
          link.href = response.data.pdf;
          link.download = `${invoiceGroup.invoiceNumber}_${new Date().getTime()}.pdf`;
          link.click();

          this.toastr.success(`Invoice ${invoiceGroup.invoiceNumber} downloaded successfully`, 'Success');
        } else {
          this.toastr.error('Failed to download invoice PDF', 'Error');
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error downloading invoice:', error);
        this.toastr.error(
          error.error?.message || 'Failed to download invoice. Please try again.',
          'Download Error'
        );
      }
    });
  }

  viewTakeoffDetails(takeoff: TakeoffForInvoice): void {
    alert(`Viewing details for takeoff ${takeoff.takeoffNumber}\nCustomer: ${takeoff.customer.name}\nValue: $${takeoff.totalValue}\nRole: ${takeoff.role}`);
  }

  removeTakeoffFromList(takeoff: TakeoffForInvoice): void {
    if (confirm(`Remove takeoff ${takeoff.takeoffNumber} from the available list? This will not delete the takeoff, just hide it from this view.`)) {
      this.availableTakeoffs = this.availableTakeoffs.filter(t => t._id !== takeoff._id);
      if (takeoff.selected) {
        this.updateSelectedTakeoffs();
        this.updateSelectAllState();
      }
      alert('Takeoff removed from the list successfully.');
    }
  }

  /**
   * Open invoice calculation modal
   * Shows pre-calculation with line items similar to PDF
   */
  openCalculationModal(takeoff: TakeoffForInvoice): void {
    this.spinner.show();

    this.invoiceService.calculateInvoicePreview(takeoff._id).subscribe({
      next: (response) => {
        this.spinner.hide();

        if (response.success) {
          const modalRef = this.modalService.open(InvoiceCalculationModalComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true
          });

          modalRef.componentInstance.calculationData = response.data;
          modalRef.componentInstance.takeoffId = takeoff._id;
        } else {
          this.toastr.error('Failed to calculate invoice', 'Error');
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error calculating invoice:', error);
        this.toastr.error(
          error.error?.message || 'Failed to calculate invoice. Please try again.',
          'Calculation Error'
        );
      }
    });
  }

  /**
   * Generate and download invoice PDF
   */
  downloadInvoicePDF(takeoff: TakeoffForInvoice): void {
    this.spinner.show();

    this.invoiceService.generateInvoicePDF(takeoff._id).subscribe({
      next: (response) => {
        this.spinner.hide();

        if (response.success && response.data.pdf) {
          // Create download link
          const link = document.createElement('a');
          link.href = response.data.pdf;
          link.download = `invoice_${takeoff.takeoffNumber}_${new Date().getTime()}.pdf`;
          link.click();

          this.toastr.success('Invoice PDF generated successfully', 'Success');
        } else {
          this.toastr.error('Failed to generate PDF', 'Error');
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error generating PDF:', error);
        this.toastr.error(
          error.error?.message || 'Failed to generate PDF. Please try again.',
          'PDF Generation Error'
        );
      }
    });
  }
}