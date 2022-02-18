import { TestBed } from '@angular/core/testing';

import { SetupShopService } from './setup-shop.service';

describe('SetupProcessService', () => {
  let service: SetupShopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetupShopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
