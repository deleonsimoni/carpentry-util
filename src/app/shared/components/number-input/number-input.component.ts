import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ]
})
export class NumberInputComponent implements ControlValueAccessor {
  @Input() min: number = 0;
  @Input() max?: number;
  @Input() step: number = 1;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;

  private _value: string = '';
  private onChange = (value: string) => {};
  public onTouched = () => {};

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  increment(): void {
    if (this.disabled || this.readonly) return;

    const currentValue = parseInt(this.value) || 0;
    let newValue = currentValue + this.step;

    if (this.max !== undefined && newValue > this.max) {
      newValue = this.max;
    }

    this.value = newValue.toString();
  }

  decrement(): void {
    if (this.disabled || this.readonly) return;

    const currentValue = parseInt(this.value) || 0;
    let newValue = currentValue - this.step;

    if (newValue < this.min) {
      newValue = this.min;
    }

    this.value = newValue.toString();
  }

  onInputChange(event: Event): void {
    if (this.readonly) return;

    const target = event.target as HTMLInputElement;
    let newValue = target.value;

    if (newValue !== '') {
      const numericValue = parseInt(newValue);
      if (!isNaN(numericValue)) {
        if (numericValue < this.min) {
          newValue = this.min.toString();
        } else if (this.max !== undefined && numericValue > this.max) {
          newValue = this.max.toString();
        }
      }
    }

    this.value = newValue;
  }

  writeValue(value: any): void {
    this._value = value || '';
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
}
