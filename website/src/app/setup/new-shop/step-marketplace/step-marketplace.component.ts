import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ShopDeployStateService } from '../shop-deploy-state.service';

export interface Marketplace {
  royalityFeeBasepoints: number
}

@Component({
  selector: 'w3s-step-marketplace',
  templateUrl: './step-marketplace.component.html',
  styleUrls: ['../new-shop.component.scss']
})
export class StepMarketplaceComponent implements OnInit {

  marketplace: UntypedFormGroup;

  @Input()
  isAdvanced: boolean;

  @Output()
  isValidEvent = new EventEmitter<boolean>();

  feeBasePoints: number = 3;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly stateService: ShopDeployStateService
  ) {

    this.marketplace = this.fb.group({
      feeBasePoints: ['', [Validators.required, Validators.max(5000), Validators.min(0)]],
    });
  }

  updateFeeBasePoints(value: string) {
    const updatedValue = parseInt(value);
    this.feeBasePoints = updatedValue / 100;
  }

  ngOnInit(): void {
    this.isValidEvent.emit(true);
  }

  getValues(): Marketplace {
    return {
      royalityFeeBasepoints: parseInt(this.marketplace.get('feeBasePoints').value)
    };
  }

  saveState(): void {
    this.stateService.registerMarketplace(this.getValues());
  }
}
