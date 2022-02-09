import { TestBed } from '@angular/core/testing';

import { CollectionResolverService } from './collection-resolver.service';

describe('CollectionResolverService', () => {
  let service: CollectionResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectionResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
