import {
  Component,
  forwardRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
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
export class CustomComboboxComponent
  implements ControlValueAccessor, OnInit, OnChanges {

  @Input() options: string[] = [];
  @Input() placeholder = '';
  @Input() customLabel = 'Custom';
  @Input() emptyOption = true;

  isCustom = false;
  internalValue: string | null = null;

  @Output() valueChange = new EventEmitter<string | null>();

  onChange = (_: any) => {};
  onTouched = () => {};

  ngOnInit(): void {}

  /**
   * Garante sincronização quando options chegam
   * depois do writeValue (caso comum com backend)
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.internalValue !== null) {
      this.syncValueWithOptions(this.internalValue);
    }
  }

  writeValue(obj: any): void {
    if (obj === '' || obj === null || obj === undefined) {
      this.internalValue = '';
      this.isCustom = false;
      return;
    }

    this.internalValue = obj;
    this.syncValueWithOptions(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // opcional no futuro
  }

  onSelectChange(value: string) {
    if (value === 'custom') {
      this.isCustom = true;
      this.internalValue = '';
      this.onChange('custom');
      this.valueChange.emit('custom');
    } else if (value === '') {
      this.internalValue = null;
      this.isCustom = false;
      this.onChange(null);
      this.valueChange.emit(null);
    } else {
      this.internalValue = value;
      this.isCustom = false;
      this.onChange(value);
      this.valueChange.emit(value);
    }
  }

  onInputBlur() {
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

  /**
   * Centraliza a regra de decisão entre select e custom
   */
  private syncValueWithOptions(value: string) {
    if (value === '') {
      this.isCustom = false;
      return;
    }

    if (this.options && this.options.includes(value)) {
      this.isCustom = false;
    } else {
      this.isCustom = true;
    }
  }
}
