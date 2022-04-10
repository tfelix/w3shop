import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faAward, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { ExistingShopService } from '../new-shop/existing-shop.service';

@Component({
  selector: 'w3s-success',
  templateUrl: './success.component.html',
})
export class SuccessComponent implements OnInit {
  faSuccess = faAward;
  faTriangleExclamation = faTriangleExclamation;

  existingShopUrl: string;

  constructor(
    private readonly router: Router,
    private readonly existingShopService: ExistingShopService
  ) { }

  ngOnInit(): void {
    if (this.existingShopService.existingShopUrl === null) {
      console.warn('No existing shop was found');
      this.router.navigateByUrl('/');
    }

    this.existingShopUrl = this.existingShopService.existingShopUrl;
  }

}
