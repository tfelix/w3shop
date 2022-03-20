import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(
    private toastr: ToastrService
  ) { }

  showError(message: string, header: string = 'Error', cause?: any) {
    this.toastr.error(message, header, {
      timeOut: 3000,
    });

    console.error(message, cause);
  }
}
