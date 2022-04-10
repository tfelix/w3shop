import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { faAngleRight, faAward, faTriangleExclamation, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, from, Observable, of } from 'rxjs';
import { delay, map, mergeMap, tap } from 'rxjs/operators';
import { ChainIdService, ProviderService } from 'src/app/core';

import { DeployResult, DeployShopService } from './deploy-shop.service';

import { NewShop } from './new-shop';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
})
export class NewShopComponent {
  faSuccess = faAward;
  faTriangleExclamation = faTriangleExclamation;
  faAngleRight = faAngleRight;
  faWallet = faWallet;
  faFileSignature = faFileSignature;

  isShopDataPresent = false;
  isShopUrlPresent = false;

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
  isReadyToDeploy = false;

  deployResult: Observable<DeployResult> | null = null;

  existingShopUrl: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly chainIdService: ChainIdService
  ) {
    this.isWalletConnected$ = this.providerService.provider$.pipe(map(x => x !== null));
    this.tryLoadExistingShopData();

    combineLatest([
      this.setupShopForm.valueChanges,
      this.providerService.chainId$
    ]).pipe(
      map(([_, chainId]) => {
        const isCorrectNetwork = this.chainIdService.expectedChainId() === chainId;
        return this.setupShopForm.valid && isCorrectNetwork;
      })
    ).subscribe(isReady => this.isReadyToDeploy = isReady);
  }

  createNewShop() {
    const form = this.setupShopForm.value;

    const newShop: NewShop = {
      shopName: form.firstStep.shopName,
      shortDescription: form.firstStep.shortDescription,
      description: form.secondStep.description,
      keywords: this.keywords,
    }

    // Save this into the local storage in case an error appears.
    localStorage.setItem(NewShopComponent.STORAGE_SHOP_DATA, JSON.stringify(newShop));

    this.deployResult = from([0, 20, 50, 60, 80, 100]).pipe(
      mergeMap(x => of(x).pipe(delay(1500))),
      map(x => {
        return {
          progress: x,
          stage: `Das ist ein Text ${x}`
        }
      }),
      tap(x => console.log(x.progress))
    );

    /*
    this.deployResult = this.deployShopService.deployShopContract(newShop);
    // TODO Improve this here.
    this.deployResult.subscribe(x => {
      console.log(x);
    });*/
  }

  connectWallet() {
    this.providerService.connectWallet();
  }

  private clearExistingShopData() {
    localStorage.removeItem(NewShopComponent.STORAGE_SHOP_DATA);
  }

  private tryLoadExistingShopData() {
    const data = localStorage.getItem(NewShopComponent.STORAGE_SHOP_DATA);
    if (!data) {
      this.isShopDataPresent = false;
      return;
    }

    const existingShop = JSON.parse(data) as NewShop;
    this.isShopDataPresent = true;
    this.setupShopForm.get('firstStep.shopName').setValue(existingShop.shopName);
    this.setupShopForm.get('firstStep.shortDescription').setValue(existingShop.shortDescription);
    this.setupShopForm.get('secondStep.description').setValue(existingShop.description);
    this.keywords = existingShop.keywords;
  }

  private static readonly STORAGE_SHOP_DATA = 'SHOP_DATA';
}
