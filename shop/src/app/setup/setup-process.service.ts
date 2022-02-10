import { Injectable } from '@angular/core';

enum SetupProcess {
  WAIT_FOR_CONTRACT_DEPLOYMENT
}

@Injectable({
  providedIn: 'root'
})
export class SetupProcessService {

  constructor() { }
}
