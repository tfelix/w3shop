import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, mergeMap, shareReplay } from 'rxjs/operators';
import { ShopService, ShopServiceFactory } from 'src/app/shop';

@Component({
  selector: 'w3s-payment-receiver',
  templateUrl: './payment-receiver.component.html',
})
export class PaymentReceiverComponent {

  paymentAccountBalance$: Observable<string> = of('');
  paymentReceiverAddress$: Observable<string> = of('');
  disabledSetPaymentReceiver$: Observable<boolean> = of(true);

  private shopService$: Observable<ShopService>;

  constructor(
    shopServiceFactory: ShopServiceFactory
  ) {
    this.shopService$ = shopServiceFactory.getShopService();
    this.refresh();
  }

  private refresh() {
    this.paymentAccountBalance$ = this.shopService$.pipe(
      mergeMap(x => x.getPaymentReceiverBalance()),
      map(x => x.substring(0, 6))
    );
    this.paymentReceiverAddress$ = this.shopService$.pipe(
      mergeMap(x => x.getPaymentReceiver()),
      shareReplay(1)
    );
  }

  checkSetPaymentReceiverEnabled(newPaymentReceiver: string) {
    this.disabledSetPaymentReceiver$ = this.paymentReceiverAddress$.pipe(
      map(pra => pra === newPaymentReceiver)
    );
  }

  setPaymentAddress(paymentAddress: string) {
    this.shopService$.pipe(
      mergeMap(x => x.setPaymentReceiver(paymentAddress)),
      // A direct refresh after the TX settled often returns the old address, we probably need
      // to wait for some amount of time before we can refresh.
      delay(1500)
    ).subscribe(_ => {
      this.refresh();
    });
  }
}
