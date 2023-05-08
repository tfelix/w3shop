import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ShopError, WalletError } from './shop-error';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private toastr!: ToastrService;

  constructor(private injector: Injector) { }

  handleError(error: any) {
    if (!this.toastr) {
      this.toastr = this.injector.get(ToastrService);
    }

    if (error.cause) {
      console.error(error, error.cause);
    } else {
      console.error(error);
    }

    // onActivatedTick must be true because change detection works a bit
    // different in an ErrorHandler in Angular.
    // See: https://github.com/scttcper/ngx-toastr/issues/327
    if (error instanceof WalletError) {
      this.showError(error.message, 'Wallet Error');
    } else if (error instanceof ShopError) {
      this.showError(error.message, 'Shop Error');
    } else {
      this.showError('A error occured and was logged.', 'General Error');
    }
  }

  private showError(message: string, title: string) {
    this.toastr.error(message, title, {
      timeOut: 40000,
      onActivateTick: true
    });
  }
}