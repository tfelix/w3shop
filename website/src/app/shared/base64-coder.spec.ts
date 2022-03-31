import { base64UrlDecode, base64UrlEncode } from './base64-coder';

describe('Base64CoderService', () => {
  describe('given a URL', () => {

    const url = 'sc:4:0xC980f1B0947bB219e20561C00622D8555C8Ab204';

    it('encodes it to web base64 and back to the same URL', () => {
      const enc = base64UrlEncode(url);
      console.log(enc);
      const dec = base64UrlDecode(enc);

      expect(url).toEqual(dec);
    });
  });
});
