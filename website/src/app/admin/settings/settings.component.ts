import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ShopFacadeFactory } from 'src/app/core';

@Component({
  selector: 'w3s-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  settingsForm = this.fb.group({
    shopName: [''],
    shortDescription: [''],
    description: [''],
  });

  keywords: string[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly shopFacadeFactory: ShopFacadeFactory
  ) {
    const shop = shopFacadeFactory.build();
    forkJoin([
      shop.shopName$,
      shop.shortDescription$,
      shop.description$,
      shop.keywords$
    ]).subscribe(([shopName, shortDescription, description, keywords]) => {
      this.settingsForm.patchValue({ shopName, shortDescription, description });
      this.keywords = keywords;
    });
  }

  onSubmit() {
    throw new Error('Not implemented');
    /*
    this.configV1$.pipe(
      map(c => ({ ...c, ...this.settingsForm.value })),
      map(c => ({ ...c, keywords: this.keywords })),
      tap(c => console.log(c))
      // TODO send to ceramic
    ).subscribe();*/
  }
}
