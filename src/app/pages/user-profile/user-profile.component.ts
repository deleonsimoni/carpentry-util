import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { OrderService } from '@app/shared/services/order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  public orderForm: FormGroup;
  carpentrys;
  user;
  idOrder;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private builder: FormBuilder,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private authService: AuthService

  ) {
    this.createForm();

  }

  ngOnInit() {
    this.listAllCarpentrys();

    this.authService.getUser().subscribe(user => this.user = user);

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idOrder = params['id'];
        this.detailOrder(this.idOrder);
      }
    });

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

  }

  detailOrder(id) {
    this.spinner.show();

    this.orderService.detailOrder(id)
      .subscribe((data) => {
        this.spinner.hide();

        if (data.errors) {
          this.toastr.error('Error get detail order', 'Atenção');
        } else {
          this.carpentrys = data;
          this.orderForm.patchValue(data[0]);

        }

      }, err => {
        this.spinner.hide();
        this.toastr.error('Error get detail order. ', 'Erro: ');
      });
  }

  listAllCarpentrys() {
    this.spinner.show();

    this.orderService.listAllCarpentrys()
      .subscribe((data) => {
        this.spinner.hide();

        if (data.errors) {
          this.toastr.error('Error get carpentry', 'Atenção');
        } else {
          this.carpentrys = data;
        }

      }, err => {
        this.spinner.hide();
        this.toastr.error('Error get carpentry. ', 'Erro: ');
      });
  }

  saveOrder() {
    this.spinner.show();
    console.table(this.orderForm.value);

    this.orderService.saveOrder(this.orderForm.value)
      .subscribe((data) => {
        this.spinner.hide();

        if (!data.errors) {
          this.toastr.success('Order Created', 'Success');
          this.router.navigate(['/tables']);
        } else {
          this.toastr.error('Erro ao registrar o inventário', 'Atenção');
        }

      }, err => {
        this.spinner.hide();
        this.toastr.error('Problema ao realizar o cadastro. ', 'Erro: ');
      });
  }

  disableField(field) {
    return field && field != '';
  }


  get isCompany() {
    return this.user.roles.includes('company');
  }


  private createForm(): void {
    this.orderForm = this.builder.group({
      carpentry: [null, [Validators.required]],
      custumerName: [null, [Validators.required]],
      foremen: [null],
      extrasChecked: [null],
      carpInvoice: [null],
      shipTo: [null],
      lot: [null],
      type: [null],
      elev: [null],
      sqFootage: [null],
      streetName: [null],

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
        qty: ''
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
      { size: '(8\')', col1: '', col2: '', col3: '', col4: '', col5: '' },
    ];

    const arrayForm = this.orderForm.get('arches') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: [{ value: dados.size, disabled: this.disableField(dados.size) }, []],
        col1: '',
        col2: '',
        col3: '',
        col4: '',
        col5: ''
      });

      arrayForm.push(formGroup);
    });

  }

  preFillRoundWindow() {
    const dadosPrePreenchidos = [
      { type: '', qty: '' }
    ];

    const arrayForm = this.orderForm.get('roundWindow') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type: '',
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }

  preFillRodSupport() {
    const dadosPrePreenchidos = [
      { type: '', desc: '', qty: '' },
      { type: '', desc: '', qty: '' }
    ];

    const arrayForm = this.orderForm.get('rodSupport') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type: [{ value: dados.type, disabled: this.disableField(dados.type) }, []],
        desc: '',
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }


  preFillClosetRods() {
    const dadosPrePreenchidos = [
      { type1: '48', type2: '72', type3: '96', type4: '120' },
      { type1: '', type2: '', type3: '', type4: '' },
    ];

    const arrayForm = this.orderForm.get('closetRods') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        type1: [{ value: dados.type1, disabled: this.disableField(dados.type1) }, []],
        type2: [{ value: dados.type2, disabled: this.disableField(dados.type2) }, []],
        type3: [{ value: dados.type3, disabled: this.disableField(dados.type3) }, []],
        type4: [{ value: dados.type4, disabled: this.disableField(dados.type4) }, []]
      });

      arrayForm.push(formGroup);
    });

  }

  preFillShelves() {
    const dadosPrePreenchidos = [
      { size: '1X12', type4: '', type6: '', type8: '', type10: '', type12: '', qty: '' },
      { size: '1X16', type4: '', type6: '', type8: '', type10: '', type12: '', qty: '' },

    ];

    const arrayForm = this.orderForm.get('shelves') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: [{ value: dados.size, disabled: this.disableField(dados.size) }, []],
        type4: '',
        type6: '',
        type8: '',
        type10: '',
        type12: '',
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }


  preFillLabour() {
    const dadosPrePreenchidos = [
      { item: 'SINGLE DOORS', qty: '' },
      { item: '8\'DOOR', qty: '' },
      { item: 'DOUBLE DOOR', qty: '' },
      { item: 'SOLID DOOR', qty: '' },
      { item: 'CANTINA DOOR', qty: '' },
      { item: 'STD. ARCHWAYS', qty: '' },
      { item: '8\' ARCHWAYS', qty: '' },
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
      { item: 'BUILD OUT (UP TO 4\")', qty: '' },
      { item: 'BUILD OUT (OVER 4\")', qty: '' },
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
        item: [{ value: dados.item, disabled: this.disableField(dados.item) }, []],
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }


  preFillTrim() {
    const dadosPrePreenchidos = [
      { item: 'Base', detalis: '', qty: '' },
      { item: 'Casing', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'Handrail', detalis: '', qty: '' },
      { item: 'Brackets', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'Burlap', detalis: '', qty: '' },
      { item: 'Burlap', detalis: '', qty: '' },
      { item: 'Doorstop', detalis: '', qty: '' },
      { item: '1/4 Round', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: '1X3', detalis: '', qty: '' },
      { item: '1X2', detalis: '', qty: '' },
      { item: 'Attic Hatch', detalis: '', qty: '' },
      { item: 'Filler', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'Window Seat', detalis: '', qty: '' },
      { item: 'Capping', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'Build out', detalis: '', qty: '' },
      { item: 'Build out', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'Crown/Cove', detalis: '', qty: '' },
      { item: 'Flex Base', detalis: '', qty: '' },
      { item: 'Columns', detalis: '', qty: '' },
      { item: '', detalis: '', qty: '' },
      { item: 'SHOEMOULD', detalis: '', qty: '' },
      { item: '1/4 ROUND', detalis: '', qty: '' },
      { item: 'Doorstop', detalis: '', qty: '' },
    ];

    const arrayForm = this.orderForm.get('trim') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        item: [{ value: dados.item, disabled: this.disableField(dados.item) }, []],
        detalis: '',
        qty: ''
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
        item: [{ value: dados.item, disabled: this.disableField(dados.item) }, []],
        type: '',
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }


  preFillSingleDoors() {
    const dadosPrePreenchidos = [
      {
        size: '1/4',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '1/6',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '1/8',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '2/0',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '2/2',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '2/4',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '2/6',
        left: '',
        right: '',
        jamb: '475',
      },
      {
        size: '2/8',
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
        size: '2/4 (8\')',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '2/6 (8\')',
        left: '',
        right: '',
        jamb: '',
      },
      {
        size: '2/8 (8\')',
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
        size: [{ value: dados.size, disabled: this.disableField(dados.size) }, []],
        left: [{ value: dados.left, disabled: this.disableField(dados.left) }, []],
        right: [{ value: dados.right, disabled: this.disableField(dados.right) }, []],
        jamb: [{ value: dados.jamb, disabled: this.disableField(dados.jamb) }, []],
      });

      arrayForm.push(formGroup);
    });

  }

  preFillFrenchDoors() {
    const dadosPrePreenchidos = [
      { size: '', height: '', jamb: '', qty: '' },
      { size: '', height: '', jamb: '', qty: '' }
    ];

    const arrayForm = this.orderForm.get('frenchDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        size: '',
        height: '',
        jamb: '',
        qty: ''
      });

      arrayForm.push(formGroup);
    });

  }

  preFillCantinaDoors() {
    const dadosPrePreenchidos = [
      { name: 'STEEL STD' },
      { name: 'STEEL STD' }
    ];

    const cantinaDoorsArray = this.orderForm.get('cantinaDoors') as FormArray;

    dadosPrePreenchidos.forEach(dados => {
      const formGroup = this.builder.group({
        name: [{ value: dados.name, disabled: true }, []],
        qty: '',
        swing: ''
      });

      cantinaDoorsArray.push(formGroup);
    });

  }


}
