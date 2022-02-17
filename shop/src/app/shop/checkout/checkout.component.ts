import { Component, OnInit } from '@angular/core';

import { faTrashCan, faAngleLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  faTrashCan = faTrashCan;
  faAngleLeft = faAngleLeft;


  constructor() { }

  ngOnInit(): void {
  }

}
