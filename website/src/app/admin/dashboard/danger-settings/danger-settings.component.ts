import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { mergeMap, take } from 'rxjs/operators';
import { ShopError } from 'src/app/core';
import { ShopServiceFactory } from 'src/app/shop';

@Component({
  selector: 'w3s-dangers-settings',
  templateUrl: './danger-settings.component.html',
  styleUrls: ['./danger-settings.component.scss']
})
export class DangerSettingsComponent {

  modalRef?: BsModalRef;

  shopName = '';

  transferOwnershipForm = this.fb.group({
    receiverAddress: ['', Validators.required],
    transferConfirm: ['', Validators.pattern('Transfer my shop')]
  });

  constructor(
    private modalService: BsModalService,
    private shopFactory: ShopServiceFactory,
    private fb: FormBuilder,
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
      console.info('Shop closed permanently');
      this.modalRef?.hide();
      this.router.navigateByUrl('/');
    });
  }

  transferOwnership() {
    const newOwner = this.transferOwnershipForm.get('receiverAddress')!.value;

    if (newOwner === null) {
      throw new ShopError('New Owner was not properly set');
    }

    this.shopFactory.getShopService().pipe(
      mergeMap(s => s.transferOwnership(newOwner))
    ).subscribe(() => {
      console.info(`Shop ownership transfered to ${newOwner}`);
      this.modalRef?.hide();
      this.router.navigate(['..']);
    });
  }
}
