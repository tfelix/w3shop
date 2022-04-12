import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faAngleRight, faAward, faTriangleExclamation, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChainIdService, ProviderService } from 'src/app/core';

import { DeployShopService, ShopDeploy } from './deploy-shop.service';

import { NewShop } from './new-shop';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
})
export class NewShopComponent implements OnInit {
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

  deployResult: Observable<ShopDeploy> | null = null;

  existingShopUrl: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly chainIdService: ChainIdService,
    private readonly router: Router,
    private viewportScroller: ViewportScroller
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

  ngOnInit(): void {
    // A bit hacky as the anchor scrolling seems not to work properly. But so far this
    // does the trick.
    this.viewportScroller.scrollToPosition([0, 0]);
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

    this.deployResult = this.deployShopService.deployShopContract(newShop);
    this.deployResult.subscribe(
      _ => { },
      err => {
        this.deployResult = null;
        throw err;
      },
      () => {
        // TODO Check if it was successful before switching pages.
        this.clearExistingShopData();
        this.router.navigateByUrl('/success');
      });
  }

  connectWallet() {
    this.providerService.connectWallet();
  }

  private clearExistingShopData() {
    localStorage.removeItem(NewShopComponent.STORAGE_SHOP_DATA);
  }

  private tryLoadExistingShopData() {
    // TODO check if there is pending deployment data already, just go into the deployment stage.

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
