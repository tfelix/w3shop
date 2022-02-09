import { TestBed } from '@angular/core/testing';

import { CeramicResolverService } from './ceramic-resolver.service';

describe('CeramicResolverService', () => {
  let service: CeramicResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CeramicResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
