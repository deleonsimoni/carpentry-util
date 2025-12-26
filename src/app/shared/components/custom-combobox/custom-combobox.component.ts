import { Component, forwardRef, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-combobox',
  templateUrl: './custom-combobox.component.html',
  styleUrls: ['./custom-combobox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomComboboxComponent),
      multi: true,
    },
  ],
})
export class CustomComboboxComponent implements ControlValueAccessor, OnInit {
  @Input() options: string[] = [];
  @Input() placeholder = '';
  @Input() customLabel = 'Custom';
  @Input() emptyOption = true; // show an empty option at top

  isCustom = false;
  internalValue: string | null = null;

  @Output() valueChange = new EventEmitter<string | null>();

  onChange = (_: any) => {};
  onTouched = () => {};

  ngOnInit(): void {}

  writeValue(obj: any): void {
    this.internalValue = obj;
    // if value is present and not one of options, treat it as custom
    if (obj && this.options.indexOf(obj) === -1) {
      this.isCustom = true;
    } else {
      this.isCustom = false;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // nothing for now
  }

  onSelectChange(value: string) {
    if (value === 'custom') {
      // switch to input mode and signal parent with token 'custom'
      this.isCustom = true;
      this.internalValue = '';
      // set control to the special token so parent can react (like existing code expects)
      this.onChange('custom');
      this.valueChange.emit('custom');
    } else if (value === '') {
      this.internalValue = null;
      this.onChange(this.internalValue);
      this.valueChange.emit(null);
    } else {
      this.internalValue = value;
      this.onChange(this.internalValue);
      this.valueChange.emit(this.internalValue);
    }
  }

  onInputBlur() {
    // if user left custom empty, revert to select
    if (!this.internalValue) {
      this.isCustom = false;
      this.onChange(null);
      this.valueChange.emit(null);
    } else {
      this.onChange(this.internalValue);
      this.valueChange.emit(this.internalValue);
    }
    this.onTouched();
  }
}
