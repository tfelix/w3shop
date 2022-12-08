import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export interface Notification {
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private readonly toastr: ToastrService
  ) { }

  notify(notification: Notification) {
    this.toastr.success(notification.message, notification.title, {
      positionClass: 'toast-bottom-right'
    });
  }
}