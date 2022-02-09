import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BigNumber } from 'ethers';
import { formatEther } from 'ethers/lib/utils';

export interface PriceView {
  currency: string;
  price: BigNumber;
}

@Component({
  selector: 'w3s-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss']
})
export class PriceComponent implements OnChanges {

  @Input()
  priceData?: PriceView;

  price: string = '';
  currencySymbol: string = '';

  ngOnChanges(_: SimpleChanges) {
    if (!this.priceData) {
      this.price = '';
      this.currencySymbol = '';
      return;
    }

    switch (this.priceData.currency) {
      case 'ETH':
        const value = BigNumber.from(this.priceData.price);
        this.price = formatEther(value);
        this.currencySymbol = 'Ξ';
        break;
      default:
        this.price = '';
        this.currencySymbol = 'Unknown Currency';
        break;
    }
  }
}
