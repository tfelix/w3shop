import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ShopError } from './shop-error';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private toastr: ToastrService;

  constructor(private injector: Injector) {

  }

  handleError(error: any) {
    if (!this.toastr) {
      this.toastr = this.injector.get(ToastrService);
    }

    console.error(error);
    if (error instanceof ShopError) {
      this.toastr.error(error.message, 'Panel Error', {
        timeOut: 40000,
      });
    }
  }
}