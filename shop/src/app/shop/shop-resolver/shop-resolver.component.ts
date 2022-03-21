import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigResolverService } from 'src/app/core';

@Component({
  templateUrl: './shop-resolver.component.html',
})
export class ShopResolverComponent {
  constructor(
    private route: ActivatedRoute,
    private configResolverService: ConfigResolverService,
  ) {
    this.configResolverService.load(this.route.snapshot);
  }
}
