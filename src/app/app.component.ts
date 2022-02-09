import { Component } from '@angular/core';
import { Web3ModalService } from '@mindsorg/web3modal-angular';
import { Observable, of } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  shopName = '';
  content$: Observable<string> = of('');

  constructor(
    private web3modalService: Web3ModalService,
  ) {

    /*.subscribe(x => {
      if (x.version == "1") {
        const config = x as ShopConfigV1;
        this.shopName = config.shopName;
        this.titleService.setTitle(config.shopName);
      }
    });*/

    // this.content$ = this.bootstrapService.test();
  }

  test() {
    this.web3modalService.open();
  }
}
