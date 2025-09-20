import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from '@app/shared/services/notification.service';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { TakeoffStatusService } from '@app/shared/services/takeoff-status.service';
import { STATUS_CONSTANTS, TakeoffStatus } from '@app/shared/interfaces/takeoff-status.interface';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { TakeoffStatusComponent } from '@app/shared/components/takeoff-status/takeoff-status.component';
import { CompleteMeasurementModalComponent } from '@app/shared/components/complete-measurement-modal/complete-measurement-modal.component';

@Component({
  selector: 'app-takeoff-measurements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TakeoffStatusComponent
  ],
  templateUrl: './takeoff-measurements.component.html',
  styleUrl: './takeoff-measurements.component.scss'
})
export class TakeoffMeasurementsComponent implements OnInit {
  measurementForm: FormGroup;
  takeoffId: string = '';
  takeoff: any = {};
  user: any = {};
  orderStatus: number = 1;
  isLoading = true;
  isAdvancingStatus = false;

  // Status constants for template
  readonly TakeoffStatus = TakeoffStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private takeoffService: TakeoffService,
    private statusService: TakeoffStatusService,
    private authService: AuthService,
    private notification: NotificationService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {
    this.measurementForm = this.initializeForm();
  }

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      this.user = user;

      // Verify user is carpenter
      if (!user || !UserRoles.isCarpenter(user.roles)) {
        this.notification.error('Access denied. Only carpenters can access this page.', 'Access Denied');
        this.router.navigate(['/']);
        return;
      }

      this.route.params.subscribe(params => {
        this.takeoffId = params['id'];
        this.loadTakeoff();
      });
    });
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      // Interior Doors
      interiorDoors: this.fb.array([
        this.createInteriorDoorGroup(),
        this.createInteriorDoorGroup(),
        this.createInteriorDoorGroup(),
        this.createInteriorDoorGroup(),
        this.createInteriorDoorGroup()
      ]),

      // Bathroom Doors
      bathroomDoors: this.fb.array([
        this.createBathroomDoorGroup(),
        this.createBathroomDoorGroup()
      ]),

      // Closet Doors
      closetDoors: this.fb.array([
        this.createClosetDoorGroup(),
        this.createClosetDoorGroup(),
        this.createClosetDoorGroup(),
        this.createClosetDoorGroup()
      ]),

      // Cantina Doors
      cantinaDoors: this.fb.array([
        this.createCantinaDoorGroup(),
        this.createCantinaDoorGroup()
      ]),

      // French Doors
      frenchDoors: this.fb.array([
        this.createFrenchDoorGroup(),
        this.createFrenchDoorGroup()
      ]),

      // Double Doors
      doubleDoors: this.fb.array([
        this.createDoubleDoorGroup(),
        this.createDoubleDoorGroup()
      ]),

      // Measurements
      measurements: this.fb.group({
        ceilingHeight: [''],
        notes: ['']
      })
    });
  }

  private createInteriorDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: [''],
      jamb: [''],
      trim: ['']
    });
  }

  private createBathroomDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: [''],
      jamb: [''],
      trim: [''],
      privacy: ['']
    });
  }

  private createClosetDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: [''],
      type: [''],
      trim: ['']
    });
  }

  private createCantinaDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: ['']
    });
  }

  private createFrenchDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: [''],
      jamb: [''],
      swing: ['']
    });
  }

  private createDoubleDoorGroup(): FormGroup {
    return this.fb.group({
      size: [''],
      height: [''],
      qty: [''],
      jamb: ['']
    });
  }

  private loadTakeoff() {
    this.isLoading = true;
    this.spinner.show();

    this.takeoffService.detailOrder(this.takeoffId).subscribe({
      next: (response) => {
        if (response.errors) {
          this.notification.error('Error loading takeoff', 'Error');
          this.router.navigate(['/']);
          return;
        }

        this.takeoff = response;
        this.orderStatus = response.status;

        // Verify carpenter is assigned to this takeoff
        if (!response.carpentry || response.carpentry._id !== this.user._id) {
          this.notification.error('You are not assigned to this takeoff', 'Access Denied');
          this.router.navigate(['/']);
          return;
        }

        // Only allow access if status is TO_MEASURE
        if (this.orderStatus !== TakeoffStatus.TO_MEASURE) {
          this.notification.info('Measurements can only be edited when status is "To Measure"', 'Information');
          this.router.navigate(['/']);
          return;
        }

        this.populateForm();
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading takeoff:', error);
        this.notification.error('Error loading takeoff', 'Error');
        this.router.navigate(['/']);
        this.spinner.hide();
      }
    });
  }

  private populateForm() {
    if (!this.takeoff) return;

    // Populate form arrays
    this.populateFormArray('interiorDoors', this.takeoff.interiorDoors || []);
    this.populateFormArray('bathroomDoors', this.takeoff.bathroomDoors || []);
    this.populateFormArray('closetDoors', this.takeoff.closetDoors || []);
    this.populateFormArray('cantinaDoors', this.takeoff.cantinaDoors || []);
    this.populateFormArray('frenchDoors', this.takeoff.frenchDoors || []);
    this.populateFormArray('doubleDoors', this.takeoff.doubleDoors || []);

    // Populate measurements
    this.measurementForm.patchValue({
      measurements: {
        ceilingHeight: this.takeoff.ceilingHeight || '',
        notes: this.takeoff.notes || ''
      }
    });
  }

  private populateFormArray(arrayName: string, data: any[]) {
    const formArray = this.measurementForm.get(arrayName) as FormArray;
    data.forEach((item, index) => {
      if (index < formArray.length) {
        formArray.at(index).patchValue(item);
      }
    });
  }

  // Getters for form arrays
  get interiorDoors() { return this.measurementForm.get('interiorDoors') as FormArray; }
  get bathroomDoors() { return this.measurementForm.get('bathroomDoors') as FormArray; }
  get closetDoors() { return this.measurementForm.get('closetDoors') as FormArray; }
  get cantinaDoors() { return this.measurementForm.get('cantinaDoors') as FormArray; }
  get frenchDoors() { return this.measurementForm.get('frenchDoors') as FormArray; }
  get doubleDoors() { return this.measurementForm.get('doubleDoors') as FormArray; }

  saveMeasurements() {
    if (this.measurementForm.valid) {
      this.spinner.show();

      const formData = this.measurementForm.value;
      const saveData = {
        ...formData,
        ceilingHeight: formData.measurements.ceilingHeight,
        notes: formData.measurements.notes
      };

      this.takeoffService.updateOrder(saveData, this.takeoffId).subscribe({
        next: (response) => {
          if (response.errors) {
            this.notification.error('Error saving measurements', 'Error');
          } else {
            this.notification.success('Measurements saved successfully', 'Success');
          }
          this.spinner.hide();
        },
        error: (error) => {
          console.error('Error saving measurements:', error);
          this.notification.error('Error saving measurements', 'Error');
          this.spinner.hide();
        }
      });
    } else {
      this.notification.warning('Please fill in all required fields', 'Validation Error');
    }
  }

  completeMeasurements() {
    this.showCompleteMeasurementModal();
  }

  private showCompleteMeasurementModal() {
    const modalRef = this.modalService.open(CompleteMeasurementModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.takeoffId = this.takeoffId;
    modalRef.componentInstance.customerName = this.takeoff.custumerName;

    modalRef.componentInstance.measurementCompleted.subscribe(() => {
      this.finalizeMeasurements();
      modalRef.close();
    });
  }

  private finalizeMeasurements() {
    this.isAdvancingStatus = true;
    this.spinner.show();

    const formData = this.measurementForm.value;
    const finalData = {
      ...formData,
      ceilingHeight: formData.measurements.ceilingHeight,
      notes: formData.measurements.notes
    };

    this.takeoffService.finalizeOrder(finalData, this.takeoffId).subscribe({
      next: (response) => {
        if (response.errors) {
          this.notification.error('Error completing measurements', 'Error');
        } else {
          this.notification.success('Measurements completed successfully', 'Success');
          this.router.navigate(['/']);
        }
        this.spinner.hide();
        this.isAdvancingStatus = false;
      },
      error: (error) => {
        console.error('Error completing measurements:', error);
        this.notification.error('Error completing measurements', 'Error');
        this.spinner.hide();
        this.isAdvancingStatus = false;
      }
    });
  }

  onStatusChanged(newStatus: number) {
    // Handle status changes if needed
    this.orderStatus = newStatus;

    // If status changed away from TO_MEASURE, redirect
    if (newStatus !== TakeoffStatus.TO_MEASURE) {
      this.notification.info('Redirecting as measurements are no longer editable', 'Status Changed');
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  get canEditMeasurements(): boolean {
    return this.orderStatus === TakeoffStatus.TO_MEASURE &&
           UserRoles.isCarpenter(this.user.roles) &&
           this.takeoff.carpentry?._id === this.user._id;
  }
}