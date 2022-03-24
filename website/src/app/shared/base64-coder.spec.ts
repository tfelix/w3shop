import { base64UrlDecode, base64UrlEncode } from './base64-coder';

describe('Base64CoderService', () => {
  describe('given a URL', () => {

    const url = 'http://test.example.com';

    it('encodes it to web base64 and back to the same URL', () => {
      const enc = base64UrlEncode(url);
      const dec = base64UrlDecode(enc);

      expect(url).toEqual(dec);
    });
  });
});
