import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { Price } from './price';

@Component({
  selector: 'w3s-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss']
})
export class PriceComponent implements OnChanges {

  @Input()
  priceData: Price | null = null;

  price: string = '';
  currencySymbol: string = '';

  ngOnChanges(_: SimpleChanges) {
    if (!this.priceData) {
      this.price = '';
      this.currencySymbol = '';
      return;
    }

    switch (this.priceData.currency) {
      case '0x0': // Address 0 is ETH
        const wei = BigNumber.from(this.priceData.amount);
        this.price = ethers.utils.formatEther(wei);
        this.currencySymbol = 'Ξ';
        break;
      default:
        this.price = '';
        this.currencySymbol = 'Unknown Currency';
        break;
    }
  }
}
