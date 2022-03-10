import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { faAngleRight, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { WalletService } from 'src/app/core';
import { environment } from 'src/environments/environment.prod';

import { SetupShopService } from '../setup-shop.service';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
})
export class NewShopComponent {
  step = 0;

  faAngleRight = faAngleRight;
  faWallet = faWallet;
  faFileSignature = faFileSignature;

  keywords: string[] = [];
  setupShopForm = this.fb.group({
    acceptTerms: [false, Validators.requiredTrue],
    firstStep: this.fb.group({
      shopName: ['', [Validators.required, Validators.maxLength(50)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(160)]],
    }),
    secondStep: this.fb.group({
      description: [''],
    }),
  });

  isWalletConnected$: Observable<boolean>;
  // This does never fire.
  isReadyToDeploy$ = forkJoin([
    of(this.setupShopForm.valid),
    this.walletService.isConnected$,
    this.walletService.network$
  ]).pipe(
    map(([isFormValid, isConnected, network]) => {
      console.log([isFormValid, isConnected, network]);
      const isCorrectNetwork = network.name === environment.network;
      return isFormValid && isConnected && isCorrectNetwork;
    })
  )

  constructor(
    private readonly fb: FormBuilder,
    private readonly walletService: WalletService,
    private readonly setupShopService: SetupShopService,
  ) {
    this.isWalletConnected$ = this.walletService.isConnected$;
  }

  nextStep(nextStep: number) {
    this.step = nextStep;
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.setupShopForm.value);
    this.setupShopService.createShop();
  }
}
