import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { faAngleRight, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { SetupShopService } from '../setup-shop.service';

@Component({
  selector: 'w3s-new-shop',
  templateUrl: './new-shop.component.html',
})
export class NewShopComponent implements OnInit {
  faAngleRight = faAngleRight;
  faWallet = faWallet;
  faFileSignature = faFileSignature;

  keywords: string[] = [];

  setupShopForm = this.fb.group({
    shopName: ['', Validators.required],
    chainId: ['', Validators.required],
    shortDescription: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly setupShopService: SetupShopService
  ) { }

  ngOnInit(): void {
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.setupShopForm.value);

    this.setupShopService.createShop();
  }

}
