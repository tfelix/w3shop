import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BootstrapService } from 'src/app/shared/bootstrap.service';

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private bootstrapService: BootstrapService,
  ) {
    this.bootstrapService.load(this.route.snapshot);
  }

  ngOnInit(): void {
  }
}
