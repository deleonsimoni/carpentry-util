import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMaterialRequestComponent } from './list-material-request.component';

describe('ListMaterialRequestComponent', () => {
  let component: ListMaterialRequestComponent;
  let fixture: ComponentFixture<ListMaterialRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListMaterialRequestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMaterialRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
