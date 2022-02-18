import { TestBed } from '@angular/core/testing';

import { Base64CoderService } from './base64-coder.service';

describe('Base64CoderService', () => {
  let service: Base64CoderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Base64CoderService);
  });

  describe('given a URL', () => {

    const url = 'http://test.example.com';

    it('encodes it to web base64 and back to the same URL', () => {
      const enc = service.base64UrlEncode(url);
      const dec = service.base64UrlDecode(enc);

      expect(url).toEqual(dec);
    });
  });
});
