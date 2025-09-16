import { Component, HostListener, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
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
  carpentrys;
  user;
  idOrder;
  mobile;
  orderStatus;
  emailRegex: RegExp =
    /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
  emailCarpentry;
  nameCarpentry;

  isVisibleCantinaDoors = false;
  isVisibleFrenchDoors = false;
  isVisibleDoubleDoors = false;
  isVisibleSingleDoors = false;
  isVisibleArches = false;
  isVisibleTrim = false;
  isVisibleHardware = false;
  isVisibleLabour = false;
  isCarpentryFound = false;

  doorsStyleValueIsOther = false;

  jambaOptions = ['475', '675'];

  doorsStyleValues = [
    'CARRERA',
    'CARRETA SOLID',
    'CLASSIC',
    'LOGAN',
    'LINCOLN PARK',
    'LIVINGSTON',
    '6 PANEL',
    'RIVERSIDE',
    'ROMAN',
    'OTHER',
  ];

  constructor(
    private router: Router,
    private takeoffService: TakeoffService,
    private builder: FormBuilder,
    private toastr: ToastrService,
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
        this.detailOrder(this.idOrder);
      }
    });

    this.fillForm();
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    event.returnValue = false;
    if (
      this.idOrder &&
      ((!this.isCompany && this.orderForm.value.status == 2) ||
        (this.isCompany && this.orderForm.value.status == 3))
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
              this.toastr.warning('Carpentry not found', 'Warning');
            } else if (data.errors) {
              this.spinner.hide();
              this.toastr.error('Error get email carpentry', 'Error');
            } else {
              this.toastr.success(
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
            this.toastr.error('Error get carpentry by email ', 'Erro: ');
          }
        );
    } else {
      this.toastr.warning('Enter the email correctly', 'Erro: ');
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
          this.toastr.error('Error get detail takeoff', 'Atenção');
        } else {
          //this.carpentrys = data;
          this.orderForm.patchValue(data[0]);
          this.orderForm?.get('carpentry')?.setValue(data[0].carpentry._id);

          this.orderForm
            ?.get('carpentryEmail')
            ?.setValue(data[0].carpentry.email);
          this.emailCarpentry = data[0].carpentry.email;
          this.nameCarpentry = data[0].carpentry.fullname;

          this.orderStatus = data[0].status;

          if (this.orderStatus > 1) {
            this.orderForm.controls['carpentry'].disable();
          }

          // Disable entire form for carpentry when takeoff is completed (status >= 3)
          if (!this.isCompany && this.orderStatus >= 3) {
            this.orderForm.disable();
            this.toastr.info(
              'This takeoff is completed and can no longer be edited.',
              'Read-only mode'
            );
          }

          this.spinner.hide();
        }
      },
      err => {
        this.spinner.hide();
        this.toastr.error('Error get detail takeoff. ', 'Erro: ');
      }
    );
  }

  listAllCarpentrys() {
    this.spinner.show();

    this.takeoffService.listAllCarpentrys().subscribe(
      data => {
        this.spinner.hide();

        if (data.errors) {
          this.toastr.error('Error get carpentry', 'Atenção');
        } else {
          this.carpentrys = data;
        }
      },
      err => {
        this.spinner.hide();
        this.toastr.error('Error get carpentry. ', 'Erro: ');
      }
    );
  }

  back() {
    this.router.navigate(['/home']);
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

  saveOrder() {
    this.spinner.show();

    this.takeoffService.saveOrder(this.orderForm.value).subscribe(
      data => {
        this.spinner.hide();

        if (!data.errors) {
          this.toastr.success('Takeoff Created', 'Success');
          this.router.navigate(['/home']);
        } else {
          this.toastr.error('Error create Takeoff', 'Atenção');
        }
      },
      err => {
        this.spinner.hide();
        this.toastr.error('Error create Takeoff', 'Erro: ');
      }
    );
  }

  updateOrder() {
    this.spinner.show();

    this.takeoffService
      .updateOrder(this.orderForm.value, this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.toastr.success('Takeoff Updated', 'Success');
          } else {
            this.toastr.error('Error update Takeoff', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.toastr.error('Error update Takeoff. ', 'Erro: ');
        }
      );
  }

  finalizeOrderPopUp(content) {
    this.modalService.open(content, { centered: true, backdrop: false });
  }

  finalizeOrderWithoutStatus() {
    this.finalizeOrder();
  }

  finalizeOrder() {
    this.spinner.show();

    this.takeoffService
      .finalizeOrder(this.orderForm.value, this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.toastr.success('Takeoff Completed', 'Success');
            this.router.navigate(['/home']);
          } else {
            this.toastr.error('Error finalize Takeoff', 'Atenção');
          }
        },
        err => {
          this.spinner.hide();
          this.toastr.error('Error finalize Takeoff', 'Erro: ');
        }
      );
  }

  backOrderToCarpentry() {
    this.spinner.show();

    this.takeoffService
      .backOrderToCarpentry(this.orderForm.value, this.idOrder)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.toastr.success(
              'Takeoff released for the carpenter',
              'Success'
            );
            this.router.navigate(['/home']);
          } else {
            this.toastr.error('Error finalize Takeoff', 'Atenção');
          }
        },
        err => {
          this.spinner.hide();
          this.toastr.error('Error finalize Takeoff', 'Erro: ');
        }
      );
  }

  disableField(field) {
    return field && field != '';
  }

  get isCompany() {
    return this.user.roles.includes('company');
  }

  private createForm(): void {
    this.authService.getUser().subscribe(user => (this.user = user));

    this.orderForm = this.builder.group({
      carpentry: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
        [Validators.required],
      ],
      custumerName: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
        [Validators.required],
      ],
      foremen: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],
      extrasChecked: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],
      carpInvoice: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],
      shipTo: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],
      lot: [{ value: null, disabled: this.user.roles.includes('carpentry') }],
      type: [{ value: null, disabled: this.user.roles.includes('carpentry') }],
      elev: [{ value: null, disabled: this.user.roles.includes('carpentry') }],
      sqFootage: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],
      streetName: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
      ],

      doorsStyle: [
        { value: null, disabled: this.user.roles.includes('carpentry') },
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
      { size: '475', col1: '', col2: '', col3: '', col4: '', col5: '' },
      { size: '675', col1: '', col2: '', col3: '', col4: '', col5: '' },
      { size: '', col1: '', col2: '', col3: '', col4: '', col5: '' },
      { size: '', col1: '', col2: '', col3: '', col4: '', col5: '' },
      { size: "(8')", col1: '', col2: '', col3: '', col4: '', col5: '' },
    ];

    const arrayForm = this.orderForm.get('arches') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: [
          { value: dados.size, disabled: this.disableField(dados.size) },
          [],
        ],
        col1: '',
        col2: '',
        col3: '',
        col4: '',
        col5: '',
      });

      arrayForm.push(formGroup);
    });
  }

  preFillRoundWindow() {
    const dadosPrePreenchidos = [{ type: '', qty: '' }];

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
      { type: 'W - HOOK', desc: '', qty: '' },
      { type: 'N - HOOK', desc: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('rodSupport') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type: [
          { value: dados.type, disabled: this.disableField(dados.type) },
          [],
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
      { item: '', details: '', qty: '' },
      { item: 'Handrail', details: '', qty: '' },
      { item: 'Brackets', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: 'Burlap', details: '', qty: '' },
      { item: 'Burlap', details: '', qty: '' },
      { item: 'Doorstop', details: '', qty: '' },
      { item: '1/4 Round', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: '1X3', details: '', qty: '' },
      { item: '1X2', details: '', qty: '' },
      { item: 'Attic Hatch', details: '', qty: '' },
      { item: 'Filler', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: 'Window Seat', details: '', qty: '' },
      { item: 'Capping', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: 'Build out', details: '', qty: '' },
      { item: 'Build out', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: 'Crown/Cove', details: '', qty: '' },
      { item: 'Flex Base', details: '', qty: '' },
      { item: 'Columns', details: '', qty: '' },
      { item: '', details: '', qty: '' },
      { item: 'SHOEMOULD', details: '', qty: '' },
      { item: '1/4 ROUND', details: '', qty: '' },
      { item: 'Doorstop', details: '', qty: '' },
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
      { item: 'Grupset', type: '', qty: '' },
      { item: 'Dummy Grupset', type: '', qty: '' },
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
        jamb: '',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '',
        left: '',
        right: '',
        jamb: '',
      },
    ];

    const arrayForm = this.orderForm.get('singleDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: [{ value: dados.size, disabled: false }, []],
        left: [{ value: dados.left, disabled: false }, []],
        right: [{ value: dados.right, disabled: false }, []],
        jamb: dados.jamb,
      });

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
}
