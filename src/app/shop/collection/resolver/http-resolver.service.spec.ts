import { TestBed } from '@angular/core/testing';

import { HttpResolverService } from './http-resolver.service';

describe('HttpResolverService', () => {
  let service: HttpResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
