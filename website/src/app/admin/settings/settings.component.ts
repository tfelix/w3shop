import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Progress } from 'src/app/shared';

import { ShopConfigUpdate, ShopServiceFactory } from 'src/app/shop';
import { SettingsService } from './settings.service';

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

  progress$: Observable<Progress<void>> | null = null;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly settingsService: SettingsService
  ) {
  }

  ngOnInit(): void {
    this.shopFacadeFactory.getShopService().subscribe(shop => {
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
    // FIXME Also handle this via the new progress system.
    this.settingsService.updateShopSettings(updatedConfig).subscribe({
      complete: () => {
        this.router.navigate(['../..'], { relativeTo: this.activatedRoute });
      }
    });
  }
}
