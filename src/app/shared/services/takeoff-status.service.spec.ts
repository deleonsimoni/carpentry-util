import { TestBed } from '@angular/core/testing';

import { TakeoffStatusService } from './takeoff-status.service';

describe('TakeoffStatusService', () => {
  let service: TakeoffStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TakeoffStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
