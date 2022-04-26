import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faAngleRight, faAward, faTriangleExclamation, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { NgWizardService } from 'ng-wizard';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ChainIds, ChainIdService, ProviderService } from 'src/app/core';
import { ShopIdentifierService } from 'src/app/core/shop/shop-identifier.service';

import { DeployShopService, ShopDeploy } from './deploy-shop.service';
import { NewShopData } from './new-shop-data';
import { ShopDeployStateService } from './shop-deploy-state.service';

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly chainIdService: ChainIdService,
    private readonly deploymentStateService: ShopDeployStateService,
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly router: Router,
    private readonly ngWizardService: NgWizardService,
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

  isValidStep1(): boolean {
    return this.setupShopForm.get('firstStep').valid;
  }

  isValidStep2(): boolean {
    return this.setupShopForm.get('secondStep').valid;
  }

  createNewShop() {
    // Switch to the loader step
    this.ngWizardService.show(3);
    const form = this.setupShopForm.value;

    const newShop: NewShopData = {
      shopName: form.firstStep.shopName,
      shortDescription: form.firstStep.shortDescription,
      description: form.secondStep.description,
      keywords: this.keywords,
    }

    // Save this into the local storage in case an error appears.
    this.deploymentStateService.registerNewShopFormData(newShop);

    this.deployResult = this.deployShopService.deployShopContract(newShop);
    this.deployResult.subscribe(
      deployResult => {
        if (deployResult.contractAddress) {
          const shopIdentifier = this.shopIdentifierService.buildSmartContractIdentifier(deployResult.contractAddress, ChainIds.ARBITRUM_RINKEBY);
          this.deploymentStateService.registerShopIdentifier(shopIdentifier);
        }
      },
      err => {
        this.deployResult = null;
        // Back to the "create shop" step
        this.ngWizardService.show(2);
        throw err;
      },
      () => {
        // TODO Check if it was actually successful before switching pages.
        //    It might be completed via an error and then we should not switch pages.
        this.deploymentStateService.clearNewShopFormData();

        this.router.navigateByUrl('/setup/success');
      });
  }

  connectWallet() {
    this.providerService.connectWallet();
  }

  private tryLoadExistingShopData() {
    // TODO check if there is pending deployment data already, just go into the deployment stage.
    const existingShop = this.deploymentStateService.getNewShopFormData();
    if (!existingShop) {
      this.isShopDataPresent = false;
      return;
    }

    this.isShopDataPresent = true;
    this.setupShopForm.get('firstStep.shopName').setValue(existingShop.shopName);
    this.setupShopForm.get('firstStep.shortDescription').setValue(existingShop.shortDescription);
    this.setupShopForm.get('secondStep.description').setValue(existingShop.description);
    this.keywords = existingShop.keywords;
  }

}
