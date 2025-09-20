import { Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { TakeoffService } from '@app/shared/services/takeoff.service';

@Component({
  selector: 'app-carpenter-autocomplete',
  standalone: true,
  imports: [CommonModule, NgbTypeaheadModule],
  templateUrl: './carpenter-autocomplete.component.html',
  styleUrl: './carpenter-autocomplete.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CarpenterAutocompleteComponent),
      multi: true
    }
  ]
})
export class CarpenterAutocompleteComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder: string = 'Type to search carpenters...';
  @Input() label: string = 'Carpenter';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() showLabel: boolean = true;
  @Input() cssClass: string = 'form-control form-control-alternative';

  @Output() carpenterSelected = new EventEmitter<any>();
  @Output() carpenterCleared = new EventEmitter<void>();

  allCarpenters: any[] = [];
  selectedCarpenter: any = null;
  searchValue: string = '';

  // ControlValueAccessor implementation
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private takeoffService: TakeoffService) {}

  ngOnInit() {
    this.loadAllCarpenters();
  }

  loadAllCarpenters() {
    this.takeoffService.listAllCarpentrys().subscribe(
      data => {
        if (data && !data.errors) {
          this.allCarpenters = data;
        }
      },
      err => {
        console.error('Error loading carpenters:', err);
      }
    );
  }

  // Autocomplete search function
  searchCarpenters = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 2) {
          return [];
        }

        return this.allCarpenters.filter(carpenter =>
          carpenter.fullname.toLowerCase().includes(term.toLowerCase()) ||
          carpenter.email.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 10);
      })
    );
  }

  // Format carpenter display in dropdown
  formatCarpenterResult = (carpenter: any) => {
    return `${carpenter.fullname} (${carpenter.email})`;
  }

  // Format carpenter input value
  formatCarpenterInput = (carpenter: any) => {
    if (carpenter && typeof carpenter === 'object') {
      return carpenter.fullname;
    }
    return carpenter;
  }

  // Handle carpenter selection
  onCarpenterSelected(event: any) {
    const selectedCarpenter = event.item;
    if (selectedCarpenter) {
      this.selectedCarpenter = selectedCarpenter;
      this.searchValue = selectedCarpenter.fullname;
      this.onChange(selectedCarpenter);
      this.carpenterSelected.emit(selectedCarpenter);
    }
  }

  // Handle input change
  onInputChange(event: any) {
    const value = event.target.value;
    this.searchValue = value;

    // If input is cleared, clear selection
    if (!value) {
      this.clearSelection();
    }
  }

  // Clear selection
  clearSelection() {
    this.selectedCarpenter = null;
    this.searchValue = '';
    this.onChange(null);
    this.carpenterCleared.emit();
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    if (value) {
      this.selectedCarpenter = value;
      this.searchValue = value.fullname || '';
    } else {
      this.clearSelection();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Handle blur event
  onBlur() {
    this.onTouched();
  }

  // Get selected carpenter info for display
  get selectedCarpenterInfo(): string {
    return this.selectedCarpenter ?
      `${this.selectedCarpenter.fullname} - ${this.selectedCarpenter.email}` : '';
  }

  // Check if carpenter is selected
  get isCarpenterSelected(): boolean {
    return !!this.selectedCarpenter;
  }
}