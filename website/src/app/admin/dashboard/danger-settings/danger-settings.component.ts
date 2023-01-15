import { Component, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { mergeMap, take } from 'rxjs/operators';
import { ShopServiceFactory } from 'src/app/shop';

@Component({
  selector: 'w3s-dangers-settings',
  templateUrl: './danger-settings.component.html',
  styleUrls: ['./danger-settings.component.scss']
})
export class DangerSettingsComponent {

  modalRef?: BsModalRef;

  shopName = '';

  constructor(
    private modalService: BsModalService,
    private shopFactory: ShopServiceFactory,
    private router: Router
  ) {
    shopFactory.getShopService().pipe(take(1)).subscribe(s => this.shopName = s.shopName);
  }

  openDialog(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-dialog-centered modal-lg' })
    );
  }

  closeShop() {
    this.shopFactory.getShopService().pipe(
      mergeMap(s => s.close())
    ).subscribe(() => {
      console.info('Shop was closed permanently');
      this.router.navigateByUrl('/');
    });
  }
}
