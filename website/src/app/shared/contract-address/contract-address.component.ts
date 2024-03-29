import { Component, Input, OnInit } from '@angular/core';
import { faArrowUpRightFromSquare, faCopy } from '@fortawesome/free-solid-svg-icons';
import { IClipboardResponse } from 'ngx-clipboard';
import { NetworkService, NotificationService } from 'src/app/core';

@Component({
  selector: 'w3s-contract-address',
  templateUrl: './contract-address.component.html',
  styleUrls: ['./contract-address.component.scss']
})
export class ContractAddressComponent implements OnInit {

  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faCopy = faCopy;

  @Input()
  address!: string;

  url!: string;

  constructor(
    private readonly networkService: NetworkService,
    private readonly notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.url = this.networkService.getChainExplorerUrl(this.address);
  }

  public copied(_: IClipboardResponse) {
    this.notificationService.notifiyClipboardCopied();
  }
}
