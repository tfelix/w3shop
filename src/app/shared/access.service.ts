import { Injectable } from '@angular/core';

import LitJsSdk from 'lit-js-sdk';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccessService {

  private readonly litClient: any = new LitJsSdk.LitNodeClient();

  constructor() {
    from(this.litClient.connect()).pipe(
      tap(x => console.log('Lit connected'))
    );
  }
}
