import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { faAngleRight, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChainIdService, ProviderService } from 'src/app/core';

import { environment } from 'src/environments/environment.prod';
import { DeployShopService } from './deploy-shop.service';

import { NewShop } from './new-shop';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
})
export class NewShopComponent {
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

  newShopUrl: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly chainIdService: ChainIdService
  ) {
    this.isWalletConnected$ = this.providerService.provider$.pipe(map(x => x !== null));
    this.checkExistingShopUrl();
    this.tryLoadExistingShopData();

    this.setupShopForm.valueChanges.subscribe(x => console.log(x));

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

    this.deployShopService.deployShopContract(newShop).subscribe(x => {
      console.log(x);

      /*
      this.clearExistingShopData();
        this.step = 4;
        this.newShopUrl = 'https://w3shop.eth/' + encCid;
        localStorage.setItem(NewShopComponent.STORAGE_EXISTING_SHOP, this.newShopUrl);*/
    });
  }

  connectWallet() {
    this.providerService.connectWallet();
  }

  private clearExistingShopData() {
    localStorage.removeItem(NewShopComponent.STORAGE_SHOP_DATA);
  }

  private checkExistingShopUrl() {
    const shopUrl = localStorage.getItem(NewShopComponent.STORAGE_EXISTING_SHOP);
    if (!shopUrl) {
      this.isShopUrlPresent = false;
      return;
    }

    this.isShopUrlPresent = true;
    this.newShopUrl = shopUrl;
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
  private static readonly STORAGE_EXISTING_SHOP = 'EXISTING_SHOP';
}
