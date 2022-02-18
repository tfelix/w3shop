import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Base64CoderService {

  constructor() { }

  base64UrlDecode(x: string): string {
    let revertedString = x.replace('_', '/').replace('-', '+');
    switch (revertedString.length % 4) {
      case 2:
        revertedString += '==';
        break;
      case 3:
        revertedString += '=';
        break
    }

    return atob(revertedString);
  }

  base64UrlEncode(x: string): string {
    let convertedString = btoa(x);
    return convertedString.replace('=', '').replace('+', '-').replace('/', '_');
  }
}
