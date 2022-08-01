import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { ShopConfigUpdate, ShopService, ShopServiceFactory } from 'src/app/core';
import { Progress } from 'src/app/shared';

@Component({
  selector: 'w3s-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  settingsForm = this.fb.group({
    shopName: ['', Validators.required],
    shortDescription: ['', Validators.required],
    description: [''],
  });

  keywords: string[] = [];

  private readonly shop: ShopService;

  progress$: Observable<Progress<void>> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    shopFacadeFactory: ShopServiceFactory,
    private readonly router: Router
  ) {
    shopFacadeFactory.shopService$.pipe(
      take(1)
    ).subscribe(shop => {
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
    }

    // How to handle the saving of the ID in the middle of the process?
    this.progress$ = this.shop.update(updatedConfig);
  }

  cancel() {
    this.router.navigate(['..', '..']);
  }
}
