import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Progress } from 'src/app/shared';

import { ShopConfigUpdate, ShopService, ShopServiceFactory } from 'src/app/shop';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  settingsForm = this.fb.group({
    shopName: ['', Validators.required],
    shortDescription: ['', Validators.required],
    description: [''],
  });

  keywords: string[] = [];

  private shop: ShopService;

  progress$: Observable<Progress<void>> | null = null;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.shopFacadeFactory.getShopService().subscribe(shop => {
      this.shop = shop;
      this.settingsForm.patchValue({
        shopName: shop.shopName,
        shortDescription: shop.shortDescription,
        description: shop.description
      });
      this.keywords = shop.keywords;
    });
  }

  onSubmit() {
    const updatedConfig: ShopConfigUpdate = {
      ...this.settingsForm.value,
      keywords: this.keywords
    };

    // How to handle the saving of the ID in the middle of the process?
    this.progress$ = this.shop.updateShopConfig(updatedConfig);
    this.progress$.subscribe({
      complete: () => {
        this.router.navigate(['../..'], { relativeTo: this.activatedRoute });
      }
    });
  }
}
