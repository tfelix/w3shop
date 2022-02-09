import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  isConnected$: Observable<boolean> = of(false);

  constructor() { }
}
