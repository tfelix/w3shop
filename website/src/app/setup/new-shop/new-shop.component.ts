import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { faAngleRight, faAward, faTriangleExclamation, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { NgWizardService } from 'ng-wizard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';

import { NetworkService } from 'src/app/core';

import { DeployShopProgress, DeployShopService } from './deploy-shop.service';
import { NewShopData } from './new-shop-data';
import { ShopDeployStateService } from './shop-deploy-state.service';

/**
 * Async form validator for correct network ID.
 */
function requireCorrectNetworkValidator(
  providerService: ProviderService,
  networkService: NetworkService,
): AsyncValidatorFn {

  return (control: AbstractControl): Observable<ValidationErrors | null> => {

    return providerService.chainId$.pipe(
      map(chainId => {
        /*const expectedNetwork = networkService.getExpectedNetwork();
        if (expectedNetwork.chainId !== chainId) {
          return { 'requireCorrectNetwork': true, 'msg': 'You are not on the expected network: ' + expectedNetwork.network };
        }*/

        return null;
      })
    );
  }
}

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
  setupShopForm: FormGroup;

  isWalletConnected$: Observable<boolean>;

  deployProgress$: Observable<DeployShopProgress | null>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly deploymentStateService: ShopDeployStateService,
    private readonly ngWizardService: NgWizardService,
    networkService: NetworkService,
    private readonly viewportScroller: ViewportScroller
  ) {
    this.isWalletConnected$ = this.providerService.provider$.pipe(map(x => x !== null));
    this.deployProgress$ = this.deployShopService.progress$;

    this.setupShopForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue],
      firstStep: this.fb.group({
        shopName: ['', [Validators.required, Validators.maxLength(50)]],
        shortDescription: ['', [Validators.required, Validators.maxLength(160)]],
      }),
      secondStep: this.fb.group({
        description: [''],
      }),
    }, {
      asyncValidators: [
        requireCorrectNetworkValidator(
          providerService,
          networkService
        )
      ]
    });

    this.tryLoadExistingShopData();
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

    const newShop = this.generateNewShopData();

    // Save this into the local storage in case an error is thrown and we need to continue.
    this.deploymentStateService.registerNewShopFormData(newShop);

    this.deployShopService.deployShopContract(newShop);

    // TODO Subscribe/Unsubscribe to the service
    /*
    this.deployResult.subscribe(
      deployResult => {
        if (deployResult.contractAddress) {
          const shopIdentifier = this.shopIdentifierService.buildSmartContractIdentifier(deployResult.contractAddress);
          this.deploymentStateService.registerShopIdentifier(shopIdentifier);
        }
      },
      err => {
        // Back to the "create shop" step
        this.ngWizardService.show(2);
        throw err;
      },
      () => {
        // TODO Check if it was actually successful before switching pages.
        //    It might be completed via an error and then we should not switch pages.
        this.deploymentStateService.clearNewShopFormData();

        this.router.navigateByUrl('/setup/success');
      });*/
  }

  private generateNewShopData(): NewShopData {
    const form = this.setupShopForm.value;

    return {
      shopName: form.firstStep.shopName,
      shortDescription: form.firstStep.shortDescription,
      description: form.secondStep.description,
      keywords: this.keywords,
    }
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
