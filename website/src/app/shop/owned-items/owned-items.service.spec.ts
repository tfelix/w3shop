import { TestBed } from '@angular/core/testing';

import { OwnedItemsService } from './owned-items.service';

describe('OwnedItemsService', () => {
  let service: OwnedItemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnedItemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
