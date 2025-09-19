import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeoffStatusComponent } from './takeoff-status.component';

describe('TakeoffStatusComponent', () => {
  let component: TakeoffStatusComponent;
  let fixture: ComponentFixture<TakeoffStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeoffStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TakeoffStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
