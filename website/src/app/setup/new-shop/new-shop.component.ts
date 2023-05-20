import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { faAngleRight, faAward, faTriangleExclamation, faWallet } from '@fortawesome/free-solid-svg-icons';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';
import { WizardComponent } from 'src/app/shared';


import { DeployShopService } from './deploy-shop/deploy-shop.service';
import { NewShopData } from './new-shop-data';
import { ShopDeployStateService } from './shop-deploy-state.service';
import { StepBasicInfoComponent } from './step-basic-info/step-basic-info.component';
import { StepMarketplaceComponent } from './step-marketplace/step-marketplace.component';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
  styleUrls: ['./new-shop.component.scss']
})
export class NewShopComponent implements OnInit, AfterViewInit, OnDestroy {
  faSuccess = faAward;
  faTriangleExclamation = faTriangleExclamation;
  faAngleRight = faAngleRight;
  faWallet = faWallet;

  isShopDataPresent = false;
  isShopUrlPresent = false;

  isAdvanced = false;

  @ViewChild('wizard')
  wizard!: WizardComponent;

  @ViewChild('basicInfo')
  basicInfo!: StepBasicInfoComponent;

  @ViewChild('marketplace')
  marketplaceStep!: StepMarketplaceComponent;

  isWalletConnected$: Observable<boolean>;

  private walletConnectedSub!: Subscription;

  constructor(
    private readonly providerService: ProviderService,
    private readonly deployShopService: DeployShopService,
    private readonly stateService: ShopDeployStateService,
    private readonly viewportScroller: ViewportScroller
  ) {
    this.isWalletConnected$ = this.providerService.isWalletConnected$;
  }

  ngOnInit(): void {
    // A bit hacky as the anchor scrolling seems not to work properly. But so far this
    // does the trick.
    this.viewportScroller.scrollToPosition([0, 0]);

    this.checkIfDataPresent();
  }

  ngAfterViewInit(): void {
    this.walletConnectedSub = this.isWalletConnected$.subscribe(x => {
      if (this.wizard.currentStep === 3) {
        if (x === true) {
          this.wizard.disableBack(true);
        }
        this.checkReadyForShopCreation(x);
      }
    });
  }

  ngOnDestroy(): void {
    this.walletConnectedSub.unsubscribe();
  }

  private checkIfDataPresent() {
    this.isShopDataPresent = this.stateService.hasBasicInformation() ||
      this.stateService.hasMarketplace();
  }

  stepChanged(curStep: number) {
    switch (curStep) {
      case 1:
        this.basicInfo.saveState();
        break;
      case 2:
        this.marketplaceStep.saveState();
        break;
      case 3:
        // Activly trigger the check for the shop creation as we are on the right step.
        this.isWalletConnected$.pipe(
          take(1)
        ).subscribe(isWalletConnected => {
          this.wizard.disableBack(isWalletConnected);
          this.checkReadyForShopCreation(isWalletConnected);
        });
        break;
    }
  }

  private checkReadyForShopCreation(isWalletConnected: boolean) {
    if (isWalletConnected) {
      const newShop = this.generateNewShopData();
      this.deployShopService.deployShop(newShop);
    }
  }

  private generateNewShopData(): NewShopData {
    return {
      ...this.basicInfo.getValues(),
      ...this.marketplaceStep.getValues(),
    };
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
