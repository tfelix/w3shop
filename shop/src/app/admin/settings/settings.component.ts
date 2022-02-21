import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BootstrapService } from 'src/app/core';
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

  private readonly configV1$: Observable<ShopConfigV1>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly bootstrapService: BootstrapService
  ) {
    this.configV1$ = this.bootstrapService.configV1$;

    this.configV1$.subscribe(c => {
      this.settingsForm.patchValue(c);
      this.keywords = c.keywords;
    });
  }

  onSubmit() {
    // Build the new config and save it to ceramic.
    this.configV1$.pipe(
      map(c => ({ ...c, ...this.settingsForm.value })),
      map(c => ({ ...c, keywords: this.keywords })),
      tap(c => console.log(c))
      // TODO send to ceramic
    ).subscribe();
  }
}
