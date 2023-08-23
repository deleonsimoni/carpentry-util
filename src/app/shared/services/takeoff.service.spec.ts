import { TestBed } from '@angular/core/testing';

import { TakeoffService } from './takeoff.service';

describe('TakeoffService', () => {
  let service: TakeoffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TakeoffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
