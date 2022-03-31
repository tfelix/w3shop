import { Component, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ShopService } from 'src/app/core';
import { ShopConfigV1 } from 'src/app/shared';

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
    @Inject('Shop') private readonly shopService: ShopService
  ) {
    forkJoin([
      this.shopService.shopName$,
      this.shopService.shortDescription$,
      this.shopService.description$,
      this.shopService.keywords$
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
