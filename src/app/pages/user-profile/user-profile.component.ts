import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  public orderForm: FormGroup;

  constructor(
    private router: Router,

    private builder: FormBuilder,
    private toastr: ToastrService
  ) {
    this.createForm();
  }

  ngOnInit() {
  }

  private createForm(): void {
    this.orderForm = this.builder.group({
      carpentryEmail: [null, [Validators.required]],
      custumerName: [null],
      foremen: [null],
      extrasChecked: [null],
      carpInvoice: [null],
      shipTo: [null],
      lot: [null],
      type: [null],
      elev: [null],
      sqFootage: [null],
      streetName: [null],

      cantinaDoors: this.builder.group({
        name: [null],
        swing: [null],
        qty: [null],
      }),

      singleDoors: this.builder.group({
        size: [null],
        left: [null],
        right: [null],
        jamb: [null],

      }),

      frenchDoors: this.builder.group({
        size: [null],
        height: [null],
        qty: [null],
        jamb: [null],

      }),

      doubleDoors: this.builder.group({
        size: [null],
        height: [null],
        qty: [null],
        jamb: [null],
      }),

      arches: this.builder.group({
        size: [null],
        content: [null],
      }),

      trim: this.builder.group({
        item: [null],
        details: [null],
        qty: [null],
      }),

      hardware: this.builder.group({
        item: [null],
        type: [null],
        qty: [null],
      }),

      labour: this.builder.group({
        item: [null],
        qty: [null],
      }),

      shelves: this.builder.group({
        size: [null],
        type: [null],
        qty: [null],
      }),

      closetRods: this.builder.group({
        size: [null],
      }),

      rodSupport: this.builder.group({
        type: [null],
        qty: [null],
      }),

      roundWindow: this.builder.group({
        type: [null],
        qty: [null],
      }),


      comment: [null],

    });
  }

}
