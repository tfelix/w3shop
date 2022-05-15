import { Component, Input, OnInit } from '@angular/core';
import { faArrowUpRightFromSquare, faCopy } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-contract-address',
  templateUrl: './contract-address.component.html',
  styleUrls: ['./contract-address.component.scss']
})
export class ContractAddressComponent implements OnInit {

  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faCopy = faCopy;

  @Input()
  address: string;

  url: string;

  private prefix = 'https://arbiscan.io/token/';

  constructor() { }

  ngOnInit(): void {
    this.url = this.prefix + this.address;
  }

}
