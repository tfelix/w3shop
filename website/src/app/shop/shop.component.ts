import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NavService } from '../core';

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent {

  shopIdentifier$: Observable<string>;

  constructor(
    private readonly navService: NavService
  ) {
    // To break the pattern and to allow the Shop service to be moved to this module
    // making everything very small, we must introduce some kind of nav service, that handles the display/visuals
    // of the navbar. Here we can load the actual shop service and then inject all the necessairy data to the navbar service without
    // requiring full shop service access in this component.
    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }
}
