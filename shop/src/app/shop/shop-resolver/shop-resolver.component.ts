import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BootstrapService } from 'src/app/shared';

@Component({
  templateUrl: './shop-resolver.component.html',
})
export class ShopResolverComponent {
  constructor(
    private route: ActivatedRoute,
    private bootstrapService: BootstrapService,
  ) {
    this.bootstrapService.load(this.route.snapshot);
  }
}
