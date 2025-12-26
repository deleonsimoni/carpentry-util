import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CustomComboboxComponent } from './custom-combobox.component';
import { DebugElement } from '@angular/core';

describe('CustomComboboxComponent', () => {
  let component: CustomComboboxComponent;
  let fixture: ComponentFixture<CustomComboboxComponent>;
  let de: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [CustomComboboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomComboboxComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    component.options = ['A', 'B'];
    fixture.detectChanges();
  });

  it('should render select with options and Custom option', () => {
    const select = de.query(By.css('select'));
    expect(select).toBeTruthy();

    const opts = select.nativeElement.querySelectorAll('option');
    // emptyOption is true by default so first is empty, then our 2 options, then Custom
    expect(opts.length).toBe(4);
    expect(opts[1].textContent.trim()).toBe('A');
    expect(opts[2].textContent.trim()).toBe('B');
    expect(opts[3].textContent.trim()).toBe('Custom');
  });

  it('selecting custom switches to input and emits custom token', () => {
    const emitted: any[] = [];
    component.valueChange.subscribe(v => emitted.push(v));

    const select: HTMLSelectElement = de.query(By.css('select')).nativeElement;
    select.value = 'custom';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // should switch to input
    expect(component.isCustom).toBeTrue();
    // form control was set to token 'custom'
    expect(emitted).toContain('custom');

    const input = de.query(By.css('input'));
    expect(input).toBeTruthy();
  });

  it('writeValue with token "custom" should NOT open input on init', () => {
    component.writeValue('custom');
    fixture.detectChanges();

    expect(component.isCustom).toBeFalse();

    const select = de.query(By.css('select'));
    expect(select).toBeTruthy();
  });

  it('writeValue with a real custom string SHOULD open input on init', () => {
    component.writeValue('Some custom');
    fixture.detectChanges();

    expect(component.isCustom).toBeTrue();
    const input = de.query(By.css('input'));
    expect(input).toBeTruthy();
  });

  it('typing custom value and blurring emits the typed value', () => {
    const emitted: any[] = [];
    component.valueChange.subscribe(v => emitted.push(v));

    // switch to custom
    component.onSelectChange('custom');
    fixture.detectChanges();

    const input: HTMLInputElement = de.query(By.css('input')).nativeElement;
    input.value = 'MyValue';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // blur triggers emission
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(component.isCustom).toBeTrue();
    expect(emitted).toContain('MyValue');
  });

  it('leaving custom empty and blurring reverts to select and emits null', () => {
    const emitted: any[] = [];
    component.valueChange.subscribe(v => emitted.push(v));

    component.onSelectChange('custom');
    fixture.detectChanges();

    const input: HTMLInputElement = de.query(By.css('input')).nativeElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(component.isCustom).toBeFalse();
    expect(emitted).toContain(null);
  });
});
