import { Component, HostListener, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { TakeoffStatusService } from '@app/shared/services/takeoff-status.service';
import { STATUS_CONSTANTS, TakeoffStatus } from '@app/shared/interfaces/takeoff-status.interface';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from '@app/shared/services/notification.service';
import { TakeoffStatusComponent } from '@app/shared/components/takeoff-status/takeoff-status.component';
import { TakeoffActionsComponent } from '@app/shared/components/takeoff-actions/takeoff-actions.component';
import { CompleteMeasurementModalComponent } from '@app/shared/components/complete-measurement-modal/complete-measurement-modal.component';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { Observable, Subject, debounceTime, distinctUntilChanged, map, merge, filter } from 'rxjs';
import { CarpenterAutocompleteComponent } from '@app/shared/components/carpenter-autocomplete/carpenter-autocomplete.component';
import { User } from '@app/shared/interfaces/user.interface';
import { Carpenter, CarpenterData, TakeoffOrder } from '@app/shared/interfaces/takeoff.interface';
import { MESSAGES, BREAKPOINTS } from '@app/shared/constants/messages.constants';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-take-off',
  templateUrl: './new-takeoff.component.html',
  styleUrls: ['./new-takeoff.component.scss'],
  animations: [
    // Definindo a animação
    trigger('fadeAnimation', [
      // Estado inicial da animação
      state('in', style({ opacity: 1, height: '*' })),
      // Transição de visível para escondido
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, height: '0' })),
      ]),
      // Transição de escondido para visível
      transition(':enter', [
        style({ opacity: 0, height: '0' }),
        animate('300ms ease-in', style({ opacity: 1, height: '*' })),
      ]),
    ]),
  ],
})
export class TakeOffComponent implements OnInit {
  public orderForm: FormGroup;
  carpentrys: Carpenter[] = [];
  user: User | null = null;
  idOrder: string | null = null;
  mobile: boolean = false;
  orderStatus: number | null = null;
  isAdvancingStatus: boolean = false;

  readonly STATUS = STATUS_CONSTANTS;
  readonly TakeoffStatus = TakeoffStatus;
  readonly MESSAGES = MESSAGES;
  isCustomHeight: boolean[] = [];

  emailRegex: RegExp =
    /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

  measurementCarpenter: CarpenterData = {
    carpenter: null,
    email: '',
    name: '',
    isFound: false
  };

  trimCarpenter: CarpenterData = {
    carpenter: null,
    email: '',
    name: '',
    isFound: false
  };

  // Legacy properties for backward compatibility
  emailCarpentry: string = '';
  nameCarpentry: string = '';
  isCarpentryFound: boolean = false;
  emailTrimCarpentry: string = '';
  nameTrimCarpentry: string = '';
  isTrimCarpentryFound: boolean = false;

  isVisibleCantinaDoors = false;
  isVisibleFrenchDoors = false;
  isVisibleDoubleDoors = false;
  isVisibleSingleDoors = false;
  isVisibleArches = false;
  isVisibleTrim = false;
  isVisibleHardware = false;
  isVisibleLabour = false;

  doorsStyleValueIsOther = false;

  jambaOptions = ['475', '675'];

  doorsStyleValues = [
    "Carrara Hollow",
    "Carrara Solid",
    "Classic Hollow",
    "Classic Solid",
    "Roman Hollow",
    "Roman Solid",
    "Lincoln Hollow",
    "Lincoln Solid",
    "Mercer Hollow",
    "Mercer Solid",
    "Logan Hollow",
    "Logan Solid",
    "Whitman Hollow",
    "Whitman Solid",
    "Riverside Holow",
    "Riverside Solid",
    "6 Panel Hollow",
    "6 Panel Solid",
    "Classic Hollow",
    "Classic Solid",
    "1 Panel Shaker",
    "2 Panel Shaker",
    "3 Panel Shaker"
  ];

  // 🪵 Baseboard
  baseboardsValues = [
    "Pine 4 Col",
    "Pine 5-1/4 Col",
    "MDF 4 Col",
    "MDF 5-1/4 Col",
    "MDF 7-1/4 Col",
    "MDF 4 1 Step",
    "MDF 5-1/4 1 Step",
    "MDF 5-1/2 1 Step",
    "MDF 7-1/4 1 Step",
    "MDF 4 Flat",
    "MDF 5 Flat",
    "MDF Groove 5"
  ];

  // 🚪 Casing
  casingsValues = [
    "Pine 2-3/4 Col",
    "Pine 3 BB Col",
    "MDF 2-3/4 Col",
    "MDF 2-3/4 1 Step",
    "MDF 3-1/4 1 Step BB",
    "MDF 3-1/2 1 Step",
    "MDF 2-1/2 Flat",
    "MDF 2 Flat",
    "MDF Groove 3-1/2"
  ];

  // 🧱 Door Stop
  doorStopsValues = [
    "1 Strp",
    "Flat",
    "Col"
  ];

  constructor(
    private router: Router,
    private takeoffService: TakeoffService,
    public statusService: TakeoffStatusService,
    private builder: FormBuilder,
    private notification: NotificationService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private modalService: NgbModal
  ) {
    this.createForm();
  }

  ngOnInit() {
    if (window.screen.width === 360) {
      // 768px portrait
      this.mobile = true;
    }

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] != 'new') {
        this.idOrder = params['id'];
        // Load carpenters first, then load takeoff details
        if (this.idOrder) {
          this.loadCarpentersAndTakeoffDetails(this.idOrder);
        }
      } else {
        // For new takeoff, just load carpenters
        this.listAllCarpentrys();
      }
    });

    this.fillForm();
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    event.returnValue = false;
    if (
      this.idOrder &&
      ((!this.isManager && this.orderForm.value.status == TakeoffStatus.TO_MEASURE) ||
        (this.isManager && this.orderForm.value.status == TakeoffStatus.UNDER_REVIEW))
    ) {
      alert('You have unsaved data changes. Are you sure to close the page?');
    }
  }

  fillForm() {
    this.preFillCantinaDoors();
    this.preFillFrenchDoors();
    this.preFillDoubleDoors();
    this.preFillSingleDoors();
    this.preFillLabour();
    this.preFillTrim();
    this.preFillHardware();
    this.preFillShelves();
    this.preFillClosetRods();
    this.preFillRodSupport();
    this.preFillArches();
    this.preFillRoundWindow();
  }

  findCarpentry() {
    if (
      this.orderForm.value.carpentryEmail &&
      this.emailValid(this.orderForm.value.carpentryEmail)
    ) {
      this.spinner.show();

      this.takeoffService
        .findCarpentry(this.orderForm.value.carpentryEmail)
        .subscribe(
          data => {
            if (!data) {
              this.spinner.hide();
              this.notification.warning('Carpentry not found', 'Warning');
            } else if (data.errors) {
              this.spinner.hide();
              this.notification.error('Error get email carpentry', 'Error');
            } else {
              this.notification.success(
                'Carpenter found and linked to takeoff ',
                'Success: '
              );

              this.emailCarpentry = data.email;
              this.nameCarpentry = data.fullname;

              this.orderForm?.get('carpentry')?.setValue(data._id);
              this.isCarpentryFound = true;
              this.spinner.hide();
            }
          },
          err => {
            this.spinner.hide();
            this.notification.error('Error get carpentry by email ', 'Erro: ');
          }
        );
    } else {
      this.notification.warning('Enter the email correctly', 'Erro: ');
    }
  }

  emailValid(email) {
    return this.emailRegex.test(email);
  }

  detailOrder(id) {
    this.spinner.show();

    this.takeoffService.detailOrder(id).subscribe(
      data => {
        if (data.errors) {
          this.spinner.hide();
          this.notification.error('Error get detail takeoff', 'Atenção');
        } else {
          this.populateFormWithData(data[0]);
          this.spinner.hide();
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error get detail takeoff. ', 'Erro: ');
      }
    );
  }

  loadCarpentersAndTakeoffDetails(takeoffId: string) {
    this.spinner.show();

    // First load carpenters
    this.takeoffService.listAllCarpentrys().subscribe(
      carpentersData => {
        if (carpentersData.errors) {
          this.spinner.hide();
          this.notification.error('Error get carpentry', 'Atenção');
        } else {
          this.carpentrys = carpentersData;

          // After carpenters are loaded, load takeoff details
          this.takeoffService.detailOrder(takeoffId).subscribe(
            takeoffData => {
              this.spinner.hide();

              if (takeoffData.errors) {
                this.notification.error('Error get detail takeoff', 'Atenção');
              } else {
                this.populateFormWithData(takeoffData[0]);
              }
            },
            err => {
              this.spinner.hide();
              this.notification.error('Error get detail takeoff. ', 'Erro: ');
            }
          );
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error get carpentry. ', 'Erro: ');
      }
    );
  }

  listAllCarpentrys() {
    this.spinner.show();

    this.takeoffService.listAllCarpentrys().subscribe(
      data => {
        this.spinner.hide();

        if (data.errors) {
          this.notification.error('Error get carpentry', 'Atenção');
        } else {
          this.carpentrys = data;
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error get carpentry. ', 'Erro: ');
      }
    );
  }

  populateFormWithData(data: any) {
    // Populate form with takeoff data
    this.orderForm.patchValue(data);

    // Set carpenter dropdown values
    if (data.carpentry) {
      this.orderForm?.get('carpentry')?.setValue(data.carpentry._id);
      this.orderForm?.get('carpentryEmail')?.setValue(data.carpentry.email);
      this.emailCarpentry = data.carpentry.email;
      this.nameCarpentry = data.carpentry.fullname;
      this.isCarpentryFound = true;
    }

    // Handle trim carpenter if it exists
    if (data.trimCarpentry) {
      this.orderForm?.get('trimCarpentry')?.setValue(data.trimCarpentry._id);
      this.emailTrimCarpentry = data.trimCarpentry.email;
      this.nameTrimCarpentry = data.trimCarpentry.fullname;
      this.isTrimCarpentryFound = true;
    } else {
      // Reset trim carpenter data when not present
      this.orderForm?.get('trimCarpentry')?.setValue('');
      this.emailTrimCarpentry = '';
      this.nameTrimCarpentry = '';
      this.isTrimCarpentryFound = false;
    }

    this.populateArches(data.arches);

    this.orderStatus = data.status;

    if (this.orderStatus !== null && this.orderStatus > 1) {
      this.orderForm.controls['carpentry'].disable();
    }

    // Disable entire form for carpentry when takeoff is completed (status >= UNDER_REVIEW)
    if (this.orderStatus !== null && STATUS_CONSTANTS.isReadOnly(this.orderStatus, this.isManager)) {
      this.orderForm.disable();
      this.notification.info(
        'This takeoff is completed and can no longer be edited.',
        'Read-only mode'
      );
    }
  }

  private populateArches(archesFromDb: any[]) {
    const arrayForm = this.orderForm.get('arches') as FormArray;
    arrayForm.clear();

    // Se não houver arches no banco → cria 1 linha vazia
    if (!archesFromDb || archesFromDb.length === 0) {
      this.addArch();
      return;
    }

    // Preenche com os existentes
    archesFromDb.forEach(a => {
      arrayForm.push(
        this.builder.group({
          size: a.size || '',
          height: a.height || '',
          heightCustom: a.heightCustom || '',
          jamb: a.jamb || '',
          jambCustom: a.jambCustom || '',
          col3: a.col3 || '',
          col4: a.col4 || '',
          qty: a.qty || '',
        })
      );
    });
  }

  onCarpenterSelected(carpenter: Carpenter): void {
    if (carpenter) {
      this.orderForm.get('carpentry')?.setValue(carpenter._id);
      this.orderForm.get('carpentryEmail')?.setValue(carpenter.email);

      this.measurementCarpenter = {
        carpenter,
        email: carpenter.email,
        name: carpenter.fullname,
        isFound: true
      };

      // Update legacy properties for template compatibility
      this.emailCarpentry = carpenter.email;
      this.nameCarpentry = carpenter.fullname;
      this.isCarpentryFound = true;

      if (this.idOrder && !this.shouldDisableFormField()) {
        this.notification.info(this.MESSAGES.INFO.MEASUREMENT_CARPENTER_ASSIGNED, this.MESSAGES.TITLE.CARPENTER_UPDATED);
        this.autoSaveCarpenterAssignment();
      }
    }
  }

  onCarpenterCleared() {
    this.orderForm.get('carpentry')?.setValue('');
    this.orderForm.get('carpentryEmail')?.setValue('');
    this.emailCarpentry = '';
    this.nameCarpentry = '';
    this.isCarpentryFound = false;

    if (this.idOrder && !this.shouldDisableFormField()) {
      this.notification.info('Measurement carpenter removed. Changes will be saved automatically.', 'Carpenter Updated');
      this.autoSaveCarpenterAssignment();
    }
  }

  onTrimCarpenterSelected(carpenter: any) {
    if (carpenter) {
      this.emailTrimCarpentry = carpenter.email;
      this.nameTrimCarpentry = carpenter.fullname;
      this.isTrimCarpentryFound = true;

      if (this.idOrder && !this.shouldDisableFormField()) {
        this.notification.info('Trim carpenter assigned. Changes will be saved automatically.', 'Carpenter Updated');
        this.autoSaveTrimCarpenterAssignment(carpenter._id);
      } else {
        this.orderForm.get('trimCarpentry')?.setValue(carpenter._id);
      }
    }
  }

  onTrimCarpenterCleared() {
    this.emailTrimCarpentry = '';
    this.nameTrimCarpentry = '';
    this.isTrimCarpentryFound = false;

    if (this.idOrder && !this.shouldDisableFormField()) {
      this.notification.info('Trim carpenter removed. Changes will be saved automatically.', 'Carpenter Updated');
      this.autoRemoveTrimCarpenter();
    } else {
      this.orderForm.get('trimCarpentry')?.setValue('');
    }
  }

  back() {
    this.router.navigate(['/takeoff']);
  }

  checkDoorsStyleValueIsOther() {
    if (
      this.orderForm.value.doorsStyle &&
      this.orderForm.value.doorsStyle == 'OTHER'
    ) {
      this.orderForm?.get('doorsStyle')?.setValue(null);
      this.doorsStyleValueIsOther = true;
    } else {
      this.doorsStyleValueIsOther = false;
    }
  }

  checkDoorsStyleValueFromCombobox(value: string | null) {
    // custom combobox emits 'custom' when user selects the Custom option
    if (value === 'custom') {
      this.orderForm?.get('doorsStyle')?.setValue(null);
      this.doorsStyleValueIsOther = true;
    } else {
      this.doorsStyleValueIsOther = false;
    }
  }

  saveOrder() {
    this.spinner.show();

    this.takeoffService.saveOrder(this.orderForm.getRawValue()).subscribe(
      data => {
        this.spinner.hide();

        if (!data.errors && data.success != false) {
          this.notification.success('Takeoff Created', 'Success');
          this.router.navigate(['/takeoff']);
        } else {
          if (data.code == "TAKEOFF_ALREADY_EXISTS") {
            this.notification.error('A takeoff with the same lot and job already exists', 'TAKEOFF ALREADY EXISTS');
          } else {
            this.notification.error('Error create Takeoff', 'Attention');
          }
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error create Takeoff', 'Erro: ');
      }
    );
  }

  updateOrder() {
    this.spinner.show();

    const formData = this.orderForm.getRawValue();
    if (!formData.trimCarpentry || formData.trimCarpentry.trim() === '') {
      delete formData.trimCarpentry;
    }

    this.takeoffService
      .updateOrder(formData, this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.notification.success('Takeoff Updated', 'Success');
          } else {
            this.notification.error('Error update Takeoff', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error update Takeoff. ', 'Erro: ');
        }
      );
  }

  finalizeOrderPopUp() {
    try {
      const modalRef = this.modalService.open(CompleteMeasurementModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });

      // Set modal inputs
      modalRef.componentInstance.takeoffId = this.idOrder;
      modalRef.componentInstance.customerName = this.orderForm?.get('custumerName')?.value || '';
      modalRef.componentInstance.isLoading = this.isAdvancingStatus;

      // Subscribe to measurement completion
      modalRef.componentInstance.measurementCompleted.subscribe(() => {
        this.finalizeOrder();
        modalRef.close();
      });

    } catch (error) {
      console.error('❌ Modal error:', error);
    }
  }

  finalizeOrderWithoutStatus() {
    this.finalizeOrder();
  }

  /**
   * Save progress without changing status
   * Allows carpenter to save work in progress during measurement phase
   */
  saveProgress() {
    if (!this.shouldShowSaveProgressButton()) {
      return;
    }

    this.spinner.show();

    this.takeoffService
      .updateOrder(this.orderForm.getRawValue(), this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();
          if (!data.errors) {
            this.notification.success('Progress saved successfully', 'Saved');
          } else {
            this.notification.error('Error saving progress', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error saving progress', 'Error');
        }
      );
  }

  autoSaveCarpenterAssignment() {
    this.spinner.show();

    const formData = this.orderForm.getRawValue();
    if (!formData.trimCarpentry || formData.trimCarpentry.trim() === '') {
      formData.trimCarpentry = null;
    }

    if (!formData.carpentry || formData.carpentry.trim() === '') {
      formData.carpentry = null;
    }

    this.takeoffService
      .updateOrder(formData, this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();
          if (!data.errors) {
          } else {
            this.notification.error('Error saving carpenter assignment', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error saving carpenter assignment', 'Error');
        }
      );
  }

  autoSaveTrimCarpenterAssignment(trimCarpenterId: string) {
    this.spinner.show();

    this.takeoffService
      .updateTrimCarpenter(this.idOrder!, trimCarpenterId)
      .subscribe(
        data => {
          this.spinner.hide();
          if (data.success) {
          } else {
            this.notification.error('Error saving trim carpenter assignment', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error saving trim carpenter assignment', 'Error');
        }
      );
  }

  autoRemoveTrimCarpenter() {
    this.spinner.show();

    this.takeoffService
      .removeTrimCarpenter(this.idOrder!)
      .subscribe(
        data => {
          this.spinner.hide();
          if (data.success) {
          } else {
            this.notification.error('Error removing trim carpenter', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error removing trim carpenter', 'Error');
        }
      );
  }

  finalizeOrder() {
    this.spinner.show();

    this.takeoffService
      .finalizeOrder(this.orderForm.getRawValue(), this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.notification.success('Takeoff Completed', 'Success');
            this.router.navigate(['/takeoff']);
          } else {
            this.notification.error('Error finalize Takeoff', 'Atenção');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error finalize Takeoff', 'Erro: ');
        }
      );
  }

  backOrderToCarpentry() {
    this.spinner.show();

    this.takeoffService
      .backOrderToCarpentry(this.orderForm.getRawValue(), this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.notification.success(
              'Takeoff released for the carpenter',
              'Success'
            );
            this.router.navigate(['/takeoff']);
          } else {
            this.notification.error('Error finalize Takeoff', 'Atenção');
          }
        },
        err => {
          this.spinner.hide();
          this.notification.error('Error finalize Takeoff', 'Erro: ');
        }
      );
  }

  disableField(field) {
    return field && field != '';
  }

  get isManager() {
    return this.user !== null && UserRoles.isManager(this.user.roles);
  }

  get userRole() {
    if (!this.user || !this.user.roles) return UserRoles.CARPENTER;

    if (UserRoles.isManager(this.user.roles)) {
      return UserRoles.MANAGER;
    } else if (UserRoles.isDelivery(this.user.roles)) {
      return UserRoles.DELIVERY;
    } else if (UserRoles.isCarpenter(this.user.roles)) {
      return UserRoles.CARPENTER;
    }
    return UserRoles.CARPENTER; // Default fallback
  }

  /**
   * Determine if form fields should be disabled based on user role
   */
  shouldDisableFormField(): boolean {
    if (!this.user || !this.user.roles) return false;

    // Delivery users can only view - no editing allowed
    if (UserRoles.isDelivery(this.user.roles)) {
      return true;
    }

    // Carpenter users can only edit measurement fields, not basic info
    if (UserRoles.isCarpenter(this.user.roles)) {
      return true; // Basic info fields are always disabled for carpenters
    }

    return false; // Managers can edit
  }

  get isReadonly() {
    // Form is readonly when takeoff is completed (status >= UNDER_REVIEW) and user is not company
    return this.orderStatus !== null && STATUS_CONSTANTS.isReadOnly(this.orderStatus, this.isManager);
  }

  private createForm(): void {
    this.authService.getUser().subscribe(user => (this.user = user));

    this.orderForm = this.builder.group({
      carpentry: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      trimCarpentry: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      custumerName: [
        { value: null, disabled: this.shouldDisableFormField() },
        [Validators.required],
      ],
      foremen: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      extrasChecked: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      carpInvoice: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      shipTo: [
        { value: null, disabled: this.shouldDisableFormField() },
        [Validators.required],

      ],
      lot: [{ value: null, disabled: this.shouldDisableFormField() },
      [Validators.required],

      ],
      type: [{ value: null, disabled: this.shouldDisableFormField() }],
      elev: [{ value: null, disabled: this.shouldDisableFormField() }],
      sqFootage: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      streetName: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],

      doorsStyle: [
        { value: null, disabled: this.shouldDisableFormField() },
      ],
      status: [null],
      carpentryEmail: [null],

      cantinaDoors: this.builder.array([]),

      singleDoors: this.builder.array([]),

      frenchDoors: this.builder.array([]),

      doubleDoors: this.builder.array([]),

      arches: this.builder.array([]),

      trim: this.builder.array([]),

      hardware: this.builder.array([]),

      labour: this.builder.array([]),

      shelves: this.builder.array([]),

      closetRods: this.builder.array([]),

      rodSupport: this.builder.array([]),

      roundWindow: this.builder.array([]),

      comment: [null],
    });
  }

  showHideFormCantina() {
    this.isVisibleCantinaDoors = !this.isVisibleCantinaDoors;
  }

  showHideFormFrench() {
    this.isVisibleFrenchDoors = !this.isVisibleFrenchDoors;
  }

  showHideFormDouble() {
    this.isVisibleDoubleDoors = !this.isVisibleDoubleDoors;
  }

  showHideFormSingle() {
    this.isVisibleSingleDoors = !this.isVisibleSingleDoors;
  }

  showHideFormArches() {
    this.isVisibleArches = !this.isVisibleArches;
  }

  showHideFormTrim() {
    this.isVisibleTrim = !this.isVisibleTrim;
  }

  showHideFormHardware() {
    this.isVisibleHardware = !this.isVisibleHardware;
  }

  showHideFormLabour() {
    this.isVisibleLabour = !this.isVisibleLabour;
  }

  preFillDoubleDoors() {
    const dadosPrePreenchidos = [
      { size: '', height: '', jamb: '', qty: '' },
      { size: '', height: '', jamb: '', qty: '' },
      { size: '', height: '', jamb: '', qty: '' },
      { size: '', height: '', jamb: '', qty: '' },
      { size: '', height: '', jamb: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('doubleDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: '',
        height: '',
        jamb: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillArches() {

    const dadosPrePreenchidos = [
      { size: '', height: '', heightCustom: '', jamb: '', jambCustom: '', col3: '', col4: '', qty: '' },
      { size: '', height: '', heightCustom: '', jamb: '', jambCustom: '', col3: '', col4: '', qty: '' },
      { size: '', height: '', heightCustom: '', jamb: '', jambCustom: '', col3: '', col4: '', qty: '' },
      { size: '', height: '', heightCustom: '', jamb: '', jambCustom: '', col3: '', col4: '', qty: '' },
      { size: '', height: '', heightCustom: '', jamb: '', jambCustom: '', col3: '', col4: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('arches') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: '',
        height: '',
        heightCustom: '',
        jamb: '',
        jambCustom: '',
        col3: '',
        col4: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  addArch() {
    const arrayForm = this.orderForm.get('arches') as FormArray;

    const novoArch = this.builder.group({
      size: '',
      height: '',
      heightCustom: '',
      jamb: '',
      jambCustom: '',
      col3: '',
      col4: '',
      qty: '',
    });

    arrayForm.push(novoArch);
  }

  removeArch(index: number) {
    const arrayForm = this.orderForm.get('arches') as FormArray;

    if (arrayForm.length > 5) {
      arrayForm.removeAt(index);
    }
  }

  preFillRoundWindow() {
    const dadosPrePreenchidos = [{ type: '', qty: '' }, { type: '', qty: '' }, { type: '', qty: '' }];

    const arrayForm = this.orderForm.get('roundWindow') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillRodSupport() {
    const dadosPrePreenchidos = [
      { type: 'W - HOOK', desc: 'W - HOOK', qty: '' },
      { type: 'N - HOOK', desc: 'N - HOOK', qty: '' },
    ];

    const arrayForm = this.orderForm.get('rodSupport') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type: [
          { value: dados.type, disabled: this.disableField(dados.type) },
        ],
        desc: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillClosetRods() {
    const dadosPrePreenchidos = [
      { type1: '', type2: '', type3: '', type4: '' },
    ];

    const arrayForm = this.orderForm.get('closetRods') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type1: [
          { value: dados.type1, disabled: this.disableField(dados.type1) },
          [],
        ],
        type2: [
          { value: dados.type2, disabled: this.disableField(dados.type2) },
          [],
        ],
        type3: [
          { value: dados.type3, disabled: this.disableField(dados.type3) },
          [],
        ],
        type4: [
          { value: dados.type4, disabled: this.disableField(dados.type4) },
          [],
        ],
      });

      arrayForm.push(formGroup);
    });
  }

  preFillShelves() {
    const dadosPrePreenchidos = [
      {
        size: '1X12',
        type4: '',
        type6: '',
        type8: '',
        type10: '',
        type12: '',
        qty: '',
      },
      {
        size: '1X16',
        type4: '',
        type6: '',
        type8: '',
        type10: '',
        type12: '',
        qty: '',
      },
    ];

    const arrayForm = this.orderForm.get('shelves') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: [
          { value: dados.size, disabled: this.disableField(dados.size) },
          [],
        ],
        type4: '',
        type6: '',
        type8: '',
        type10: '',
        type12: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillLabour() {
    const dadosPrePreenchidos = [
      { item: 'SINGLE DOORS', qty: '' },
      { item: "8'DOOR", qty: '' },
      { item: 'DOUBLE DOOR', qty: '' },
      { item: 'SOLID DOOR', qty: '' },
      { item: 'CANTINA DOOR', qty: '' },
      { item: 'STD. ARCHWAYS', qty: '' },
      { item: "8' ARCHWAYS", qty: '' },
      { item: 'REGULAR WINDOWS', qty: '' },
      { item: 'ROUND WINDOWS', qty: '' },
      { item: 'OPEN TO ABOVE WIND', qty: '' },
      { item: 'OPEN TO ABOVE B.OUT', qty: '' },
      { item: 'ATTIC HATCH', qty: '' },
      { item: 'CAPPING', qty: '' },
      { item: 'SHELVING', qty: '' },
      { item: 'STARIS (STRAIGHT)', qty: '' },
      { item: 'STAIRS (CIRC/WIND)', qty: '' },
      { item: 'STAIRS (1/2 FLIGHT)', qty: '' },
      { item: 'DOOR CLOSER', qty: '' },
      { item: 'SHOE MOULDING', qty: '' },
      { item: 'BUILD OUT (UP TO 4")', qty: '' },
      { item: 'BUILD OUT (OVER 4")', qty: '' },
      { item: 'HIGH FLOOR', qty: '' },
      { item: 'WINDOW SEAT', qty: '' },
      { item: 'EXTERIOR LOCKS', qty: '' },
      { item: 'RAILING', qty: '' },
      { item: 'BASEMENTS STAIRS', qty: '' },
      { item: 'WET AREA', qty: '' },
      { item: 'PARAPET OPENINGS', qty: '' },
      { item: 'SOLID COLUMNS', qty: '' },
      { item: 'SPLIT COLUMNS', qty: '' },

      { item: '', qty: '' },
      { item: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('labour') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        item: [
          { value: dados.item, disabled: this.disableField(dados.item) },
          [],
        ],
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillTrim() {
    const dadosPrePreenchidos = [
      { item: 'Base', details: '', qty: '' },
      { item: 'Casing', details: '', qty: '' },
      { item: 'Handrail', details: '', qty: '' },
      { item: 'Brackets', details: '', qty: '' },
      { item: 'Burlap 1-1/4"', details: '', qty: '' },
      { item: 'Burlap 1-5/8”', details: '', qty: '' },
      { item: 'Oak', details: '', qty: '' },
      { item: '1/4 Round', details: '', qty: '' },
      { item: '1X3', details: '', qty: '' },
      { item: '1X2', details: '', qty: '' },
      { item: 'Attic Hatch', details: '', qty: '' },
      { item: 'Filler', details: '', qty: '' },
      { item: 'Window Seat', details: '', qty: '' },
      { item: 'Capping', details: '', qty: '' },
      { item: 'Build out', details: '', qty: '' },
      { item: 'Build out', details: '', qty: '' },
      { item: 'Crown/Cove', details: '', qty: '' },
      { item: 'Flex Base', details: '', qty: '' },
      { item: 'Columns', details: '', qty: '' },
      { item: 'SHOEMOULD', details: '', qty: '' },
      { item: 'Oak Combo', details: '', qty: '' },
      { item: 'Doorstop', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '', details: '', qty: '' },

    ];

    const arrayForm = this.orderForm.get('trim') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        item: [
          { value: dados.item, disabled: this.disableField(dados.item) },
          [],
        ],
        details: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });

  }

  preFillHardware() {
    const dadosPrePreenchidos = [
      { item: 'Gripset', type: '', qty: '' },
      { item: 'Dummy Gripset', type: '', qty: '' },
      { item: 'Deadbolt/Pass', type: '', qty: '' },
      { item: 'Privacy', type: '', qty: '' },
      { item: 'Passage', type: '', qty: '' },
      { item: 'Dummy', type: '', qty: '' },
      { item: 'Key Lock', type: '', qty: '' },
      { item: 'Flush Bolt', type: '', qty: '' },
      { item: 'Rollet Catch', type: '', qty: '' },
      { item: 'Magnetic Catch', type: '', qty: '' },
      { item: 'Surface Bolt', type: '', qty: '' },
      { item: 'S/Closer', type: '', qty: '' },
      { item: 'Chain', type: '', qty: '' },
      { item: 'Door Bumper', type: '', qty: '' },
      { item: 'Power Bolt', type: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('hardware') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        item: [
          { value: dados.item, disabled: this.disableField(dados.item) },
          [],
        ],
        type: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillSingleDoors() {
    const dadosPrePreenchidos = [
      {
        size: '',
        left: '',
        right: '',
        height: '',
        jamb: '475',
      },
      {
        size: '',
        left: '',
        right: '',
        height: '',
        jamb: '475',
      },
      {
        size: '',
        left: '',
        right: '',
        height: '',
        jamb: '475',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '',
        left: '',
        right: '',
        height: '',
        jamb: '475',
      },
      {
        size: '',
        left: '',
        right: '',
        height: '',
        jamb: '475',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '475',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '475',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
      {
        size: '',
        height: '',
        left: '',
        right: '',
        jamb: '',
        sizeHeight: '',
      },
    ];

    const standardHeights = ['80', '84', '96'];

    const arrayForm = this.orderForm.get('singleDoors') as FormArray;
    arrayForm.clear();

    this.isCustomHeight = [];


    dadosPrePreenchidos.forEach(dados => {

      const isCustom = !!dados.height && !standardHeights.includes(dados.height as string);
      this.isCustomHeight.push(isCustom);

      const formGroup = this.builder.group({
        size: [{ value: dados.size, disabled: false }, []],
        height: [{ value: dados.height, disabled: false }, []],
        left: [{ value: dados.left, disabled: false }, []],
        right: [{ value: dados.right, disabled: false }, []],
        jamb: dados.jamb,
        sizeHeight: [{ value: dados.sizeHeight, disabled: true }, []],
      });

      this.updateSizeHeightForIndex(formGroup);

      arrayForm.push(formGroup);
    });


  }

  preFillFrenchDoors() {
    const dadosPrePreenchidos = [
      { size: '', swing: '', height: '', jamb: '', qty: '' },
      { size: '', swing: '', height: '', jamb: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('frenchDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: '',
        swing: '',
        height: '',
        jamb: '',
        qty: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillCantinaDoors() {
    const dadosPrePreenchidos = [{ name: 'STEEL STD' }, { name: 'SOLID STD' }];

    const cantinaDoorsArray = this.orderForm.get('cantinaDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        name: [{ value: dados.name, disabled: true }],
        qty: '',
        swing: '',
        jamb: '',
      });

      cantinaDoorsArray.push(formGroup);
    });
  }

  onHeightChange(event: Event, index: number) {
    const value = (event.target as HTMLSelectElement).value;
    const singleDoorsArray = this.orderForm.get('singleDoors') as FormArray;
    const control = singleDoorsArray.at(index).get('height');

    if (value === 'custom') {
      // muda para input e mantém o valor atual (se houver)
      this.isCustomHeight[index] = true;
      control?.setValue(''); // limpa para digitação
    } else {
      this.isCustomHeight[index] = false;
      control?.setValue(value);
      this.updateSingleDoorSize(index);
    }
  }

  onHeightComboboxChange(value: string | null, index: number) {
    const singleDoorsArray = this.orderForm.get('singleDoors') as FormArray;
    const control = singleDoorsArray.at(index).get('height');

    if (value === 'custom') {
      // user selected the custom token — show input
      this.isCustomHeight[index] = true;
      control?.setValue('');
    } else if (value === null) {
      // user cleared or reverted — hide custom
      this.isCustomHeight[index] = false;
      control?.setValue(null);
    } else {
      // regular value
      this.isCustomHeight[index] = false;
      control?.setValue(value);
      this.updateSingleDoorSize(index);
    }
  }

  updateSingleDoorSize(index: number): void {
    const singleDoorsArray = this.orderForm.get('singleDoors') as FormArray;
    const singleDoorForm = singleDoorsArray.at(index) as FormGroup;

    this.updateSizeHeightForIndex(singleDoorForm);
  }

  onCustomHeightBlur(index: number) {
    const singleDoorsArray = this.orderForm.get('singleDoors') as FormArray;
    const heightValue = singleDoorsArray.at(index).get('height')?.value;
    if (!heightValue) {
      // se o campo custom foi deixado vazio, volta a ser combo
      this.isCustomHeight[index] = false;
    }
  }

  private updateSizeHeightForIndex(formGroup: FormGroup): void {
    const size = formGroup.get('size')?.value || '';
    const height = formGroup.get('height')?.value || '';

    let combinedValue = '';
    if (size && height) {
      combinedValue = `${size}x${height}`;
    } else if (size) {
      combinedValue = size;
    }

    formGroup.get('sizeHeight')?.setValue(combinedValue);
  }

  canAdvanceStatus(): boolean {
    if (!this.orderStatus || !this.user) return false;

    // ONLY COMPANY can use status change dropdown
    if (!this.isManager) return false;

    // Company always has access to status dropdown for full flexibility
    return true;
  }

  getNextStatusLabel(): string {
    if (!this.orderStatus) return '';

    const nextStatuses = this.statusService.getNextStatuses(this.orderStatus!);
    if (nextStatuses.length === 0) return '';

    return `Approve to ${nextStatuses[0].label}`;
  }

  advanceStatus(): void {
    if (!this.canAdvanceStatus() || this.isAdvancingStatus) return;

    const nextStatuses = this.statusService.getNextStatuses(this.orderStatus!);
    if (nextStatuses.length === 0) return;

    const nextStatus = nextStatuses[0];
    this.advanceToSpecificStatus(nextStatus.id);
  }

  /**
   * Advance to a specific status (used by company dropdown)
   */
  advanceToSpecificStatus(newStatusId: number): void {
    if (this.isAdvancingStatus || newStatusId === this.orderStatus) return;

    const statusInfo = this.statusService.getStatusInfo(newStatusId);
    this.isAdvancingStatus = true;

    this.statusService.updateTakeoffStatus(this.idOrder!, newStatusId).subscribe(
      (response) => {
        this.isAdvancingStatus = false;
        this.orderStatus = newStatusId;
        this.notification.success(`Status updated to ${statusInfo.label}`, 'Success');
      },
      (error) => {
        this.isAdvancingStatus = false;
        this.notification.error('Error updating status', 'Error');
        console.error('Error updating status:', error);
      }
    );
  }

  /**
   * Get all available statuses for company dropdown
   */
  getAllStatuses() {
    return [
      this.statusService.getStatusInfo(STATUS_CONSTANTS.CREATED),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.TO_MEASURE),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.UNDER_REVIEW),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.READY_TO_SHIP),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.SHIPPED),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.TRIMMING_COMPLETED),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.BACK_TRIM_COMPLETED),
      this.statusService.getStatusInfo(STATUS_CONSTANTS.CLOSED)
    ];
  }

  // ====== BUTTON DISPLAY LOGIC ======

  /**
   * Controls when the "Recall email to carpenter" button should be displayed
   */
  shouldShowRecallEmailButton(): boolean {
    return this.isManager || (this.orderStatus !== null && !STATUS_CONSTANTS.isCompleted(this.orderStatus));
  }

  /**
   * Controls when the "Save Progress" button should be displayed for carpenters
   */
  shouldShowCarpenterSaveButton(): boolean {
    return !this.isManager && this.orderStatus !== null && STATUS_CONSTANTS.can.userSaveProgress(this.orderStatus, 'carpenter');
  }

  /**
   * Controls when the "Save Progress" button should be displayed for companies
   */
  shouldShowCompanySaveButton(): boolean {
    return this.isManager && this.orderStatus !== null && STATUS_CONSTANTS.can.userSaveProgress(this.orderStatus, 'manager');
  }

  /**
   * Controls when the "Complete Takeoff" button should be displayed
   * Carpenter can complete takeoff when they finish measurement (TO_MEASURE -> UNDER_REVIEW)
   */
  shouldShowCompleteButton(): boolean {
    // CARPENTER: Only show during measurement phase (TO_MEASURE)
    // COMPANY: Never shows this button (uses dropdown instead)
    return !this.isManager && this.orderStatus === TakeoffStatus.TO_MEASURE;
  }

  /**
   * Controls when the "Save Progress" button should be displayed
   * Carpenter can save progress during measurement phase (TO_MEASURE)
   */
  shouldShowSaveProgressButton(): boolean {
    // CARPENTER: Only show during measurement phase (TO_MEASURE)
    // COMPANY: Never shows this button (has autosave or other save mechanisms)
    return !this.isManager && this.orderStatus === TakeoffStatus.TO_MEASURE;
  }

  /**
   * Controls when the "Back to Carpentry" button should be displayed
   */
  shouldShowBackToCarpentryButton(): boolean {
    return this.isManager && this.orderStatus !== null && STATUS_CONSTANTS.permissions.company.canBackToCarpentry(this.orderStatus);
  }

  /**
   * Controls when the carpenter search UI should be displayed
   */
  shouldShowCarpenterSearch(): boolean {
    return this.isManager && STATUS_CONSTANTS.permissions.company.canSendToCarpenter(this.orderStatus || TakeoffStatus.CREATED);
  }

  /**
   * Controls when managers can edit carpenter assignments in existing takeoffs
   */
  canEditCarpenterAssignments(): boolean {
    return this.isManager && !!this.idOrder && !this.shouldDisableFormField();
  }

  /**
   * Controls when the read-only status indicator should be displayed
   */
  shouldShowReadOnlyIndicator(): boolean {
    return this.orderStatus !== null && STATUS_CONSTANTS.isReadOnly(this.orderStatus, this.isManager);
  }

  /**
   * Controls when the completion status should be displayed
   */
  shouldShowCompletionStatus(): boolean {
    return this.orderStatus !== null && STATUS_CONSTANTS.isCompleted(this.orderStatus) && !this.isManager;
  }

  /**
   * Controls when show/hide section buttons should be displayed
   * Only when form is editable for the current user
   */
  shouldShowSectionToggleButtons(): boolean {
    if (this.isManager) {
      return this.orderStatus !== null && STATUS_CONSTANTS.permissions.company.canEdit(this.orderStatus);
    } else {
      return this.orderStatus !== null && STATUS_CONSTANTS.permissions.carpenter.canEdit(this.orderStatus); // Only TO_MEASURE
    }
  }

  /**
   * Company: Approve for shipping - advances from UNDER_REVIEW to READY_TO_SHIP
   */
  approveForShipping(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.UNDER_REVIEW) {
      return;
    }
    if (this.orderForm?.get('trimCarpentry')?.value == '' && !this.isTrimCarpentryFound) {
      this.notification.info('Set the trim carpenter from takeoff', 'Trim Carpenter');
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.READY_TO_SHIP);
  }

  /**
   * Company: Back to measurement - reverts from UNDER_REVIEW to TO_MEASURE
   */
  backToMeasurement(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.UNDER_REVIEW) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.TO_MEASURE);
  }

  /**
   * Manager/Delivery: Mark as shipped - advances from READY_TO_SHIP to SHIPPED
   */
  markAsShipped(): void {
    const userRole = this.userRole;
    const hasPermission = userRole === 'manager' || userRole === 'delivery';

    if (this.isAdvancingStatus || !hasPermission || this.orderStatus !== TakeoffStatus.READY_TO_SHIP) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.SHIPPED);
  }

  /**
   * Company: Send to carpenter - advances from CREATED to TO_MEASURE
   */
  sendToCarpenter(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.CREATED) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.TO_MEASURE);
  }

  /**
   * Company: Mark trimming completed - advances from SHIPPED to TRIMMING_COMPLETED
   */
  markTrimmingCompleted(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.SHIPPED) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.TRIMMING_COMPLETED);
  }

  /**
   * Company: Mark back trim completed - advances from TRIMMING_COMPLETED to BACK_TRIM_COMPLETED
   */
  markBackTrimCompleted(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.TRIMMING_COMPLETED) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.BACK_TRIM_COMPLETED);
  }

  /**
   * Company: Close service - advances from BACK_TRIM_COMPLETED to CLOSED
   */
  closeService(): void {
    if (this.isAdvancingStatus || !this.isManager || this.orderStatus !== TakeoffStatus.BACK_TRIM_COMPLETED) {
      return;
    }
    this.advanceToSpecificStatus(TakeoffStatus.CLOSED);
  }


}
