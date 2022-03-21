import { TestBed } from '@angular/core/testing';

import { ItemLoaderService } from './item-loader.service';

describe('BootstrapService', () => {
  let service: ItemLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
