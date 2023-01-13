import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ShopDeployStateService } from '../shop-deploy-state.service';

export interface BasicShopInfo {
  shopName: string;
  shortDescription: string;
  keywords: string[];
  description: string;
}

@Component({
  selector: 'w3s-step-basic-info',
  templateUrl: './step-basic-info.component.html',
  styleUrls: ['../new-shop.component.scss', './step-basic-info.component.scss']
})
export class StepBasicInfoComponent implements OnDestroy, OnInit {

  basicShopInfo: UntypedFormGroup;

  @Input()
  isAdvanced: boolean;

  @Output()
  isValidEvent = new EventEmitter<boolean>();

  private formSub: Subscription;

  keywords: string[] = [];

  showPreview: boolean = false;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly stateService: ShopDeployStateService
  ) {

    this.basicShopInfo = this.fb.group({
      shopName: ['', [Validators.required, Validators.maxLength(50)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(160)]],
      description: ['']
    });

    const savedState = this.stateService.getBasicInfo();
    if (savedState) {
      this.basicShopInfo.patchValue(savedState);
      this.keywords = savedState.keywords;
    }

    this.formSub = this.basicShopInfo.statusChanges.subscribe(result => {
      this.isValidEvent.emit(result === 'VALID');
    });
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  public get description(): string {
    return this.basicShopInfo.get('description').value || 'No description given';
  }

  getValues(): BasicShopInfo {
    return {
      ...this.basicShopInfo.value,
      keywords: this.keywords
    };
  }

  saveState(): void {
    this.stateService.registerBasicShopInfo(this.getValues());
  }

  ngOnInit(): void {
    this.isValidEvent.emit(this.basicShopInfo.valid);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
  }
}
