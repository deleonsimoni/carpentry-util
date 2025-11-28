import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialRequestService } from '@app/shared/services/material-request.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-material-request',
  templateUrl: './material-request.component.html',
  styleUrls: ['./material-request.component.scss'],
})
export class MaterialRequestComponent implements OnInit {

  materialRequestForm!: FormGroup;
  isEditMode = false;
  requestId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private materialRequestService: MaterialRequestService,
    private notification: NotificationService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private route: ActivatedRoute,

  ) { }

  ngOnInit(): void {
    this.spinner.show();

    this.initForm();

    // Check for ID in URL
    this.requestId = this.route.snapshot.paramMap.get('id');

    if (this.requestId && this.requestId != "new") {
      this.isEditMode = true;
      this.loadExistingRequest(this.requestId);
    }
    this.spinner.hide();

  }

  initForm(): void {
    this.materialRequestForm = this.fb.group({
      customerName: ['', Validators.required],
      requestType: ['PICKUP', Validators.required],
      deliveryOrPickupDate: ['', Validators.required],

      deliveryAddressStreet: [''],
      deliveryAddressCity: [''],
      deliveryAddressProvince: [''],
      deliveryAddressPostalCode: [''],

      deliveryInstruction: [''],

      material: this.fb.array([], Validators.required)
    });

    // Start with one empty material row for Create mode
    if (!this.isEditMode) {
      this.addMaterial();
    }

    this.materialRequestForm.get('requestType')?.valueChanges.subscribe(value => {
      this.updateDeliveryAddressValidation(value);
    });
  }

  loadExistingRequest(id: string): void {
    this.materialRequestService.detail(id).subscribe({
      next: (res) => {
        const req = res[0];  // Ajuste importante

        if (!req) {
          this.notification.error('Material Request not found.', 'Error');
          this.router.navigate(['/material-request']);
          return;
        }

        this.materialRequestForm.patchValue({
          customerName: req.customerName,
          requestType: req.requestType,
          deliveryOrPickupDate: req.deliveryOrPickupDate,
          deliveryAddressStreet: req.deliveryAddressStreet,
          deliveryAddressCity: req.deliveryAddressCity,
          deliveryAddressProvince: req.deliveryAddressProvince,
          deliveryAddressPostalCode: req.deliveryAddressPostalCode,
          deliveryInstruction: req.deliveryInstruction
        });

        // Rebuild material array
        const materialFormArray = this.materialRequestForm.get('material') as FormArray;
        materialFormArray.clear();

        req.material.forEach((item: any) => {
          materialFormArray.push(
            this.fb.group({
              description: [item.description, Validators.required],
              quantity: [item.quantity, [Validators.required, Validators.min(1)]],
              notes: [item.notes]
            })
          );
        });

        this.updateDeliveryAddressValidation(req.requestType);
      },
      error: () => {
        this.notification.error('Unable to load Material Request.', 'Error');
        this.router.navigate(['/list-material-request']);
      }
    });
  }

  get materialControls(): FormGroup[] {
    return (this.materialRequestForm.get('material') as FormArray).controls as FormGroup[];
  }

  addMaterial(): void {
    const materialArray = this.materialRequestForm.get('material') as FormArray;
    materialArray.push(
      this.fb.group({
        description: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        notes: ['']
      })
    );
  }

  removeMaterial(index: number): void {
    const materialArray = this.materialRequestForm.get('material') as FormArray;
    if (materialArray.length > 1) {
      materialArray.removeAt(index);
    }
  }

  updateDeliveryAddressValidation(requestType: string): void {

    const street = this.materialRequestForm.get('deliveryAddressStreet');
    const city = this.materialRequestForm.get('deliveryAddressCity');
    const province = this.materialRequestForm.get('deliveryAddressProvince');
    const postal = this.materialRequestForm.get('deliveryAddressPostalCode');

    if (requestType === 'DELIVERY') {
      street?.setValidators([Validators.required]);
     
    } else {
      street?.clearValidators();
      
    }

    street?.updateValueAndValidity();
    city?.updateValueAndValidity();
    province?.updateValueAndValidity();
    postal?.updateValueAndValidity();
  }

  submitRequest(): void {

    if (this.materialRequestForm.invalid) {
      this.notification.error('Please fill out all required fields.', 'Form Error');
      return;
    }

    const payload = this.materialRequestForm.value;

    if (this.isEditMode && this.requestId) {
      this.updateRequest(this.requestId, payload);
    } else {
      this.createRequest(payload);
    }
  }

  private createRequest(payload: any): void {
    this.spinner.show();

    this.materialRequestService.save(payload).subscribe({
      next: () => {
        this.spinner.hide();

        this.notification.success('Material Request created successfully!', 'Success');
        this.router.navigate(['/list-material-request']);
      },
      error: () => {
        this.spinner.hide();

        this.notification.error('Error creating Material Request.', 'Error');
      }
    });
  }

  private updateRequest(id: string, payload: any): void {
    this.spinner.show();

    this.materialRequestService.update(payload, id).subscribe({
      next: () => {
        this.spinner.hide();
        this.notification.success('Material Request updated successfully!', 'Success');
        this.router.navigate(['/list-material-request']);
      },
      error: () => {
        this.spinner.hide();

        this.notification.error('Error updating Material Request.', 'Error');
      }
    });
  }

}
