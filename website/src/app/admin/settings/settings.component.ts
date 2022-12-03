import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Progress } from 'src/app/shared';

import { ShopConfigUpdate, ShopService, ShopServiceFactory } from 'src/app/shop';

@Component({
  selector: 'w3s-settings',
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
    private readonly fb: FormBuilder,
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly router: Router
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

    console.log(updatedConfig);

    // How to handle the saving of the ID in the middle of the process?
    this.progress$ = this.shop.updateShopConfig(updatedConfig);
  }

  cancel() {
    this.router.navigate(['..', '..']);
  }
}
