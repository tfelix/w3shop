import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ShopConfigUpdate, ShopFacade, ShopFacadeFactory } from 'src/app/core';
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

  private readonly shop: ShopFacade;

  progress: Observable<Progress> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    shopFacadeFactory: ShopFacadeFactory,
    private readonly router: Router
  ) {
    this.shop = shopFacadeFactory.build();

    forkJoin([
      this.shop.shopName$,
      this.shop.shortDescription$,
      this.shop.description$,
      this.shop.keywords$
    ]).subscribe(([shopName, shortDescription, description, keywords]) => {
      this.settingsForm.patchValue({ shopName, shortDescription, description });
      this.keywords = keywords;
    });
  }

  onSubmit() {
    const updatedConfig: ShopConfigUpdate = {
      ...this.settingsForm.value,
      keywords: this.keywords
    }

    // How to handle the saving of the ID in the middle of the process?
    this.progress = this.shop.update(updatedConfig);
    this.progress.subscribe(
      _ => { },
      _ => { this.progress = null; },
      () => { this.progress = null; }
    );
  }

  cancel() {
    this.router.navigate(['..', '..']);
  }
}
