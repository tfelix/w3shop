import { TestBed } from '@angular/core/testing';

import { SetupProcessService } from './setup-process.service';

describe('SetupProcessService', () => {
  let service: SetupProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetupProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
