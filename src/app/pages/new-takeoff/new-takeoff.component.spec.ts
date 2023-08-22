import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeOffComponent } from './new-takeoff.component';

describe('TakeOffComponent', () => {
  let component: TakeOffComponent;
  let fixture: ComponentFixture<TakeOffComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TakeOffComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TakeOffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
