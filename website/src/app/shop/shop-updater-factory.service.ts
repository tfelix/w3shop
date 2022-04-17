import { Inject } from "@angular/core";
import { forkJoin } from "rxjs";
import { ShopConfigUpdate, ShopFacade, UploadService } from "src/app/core";
import { Progress } from "../shared";


export class ShopUpdaterFactoryService {



}

class SmartContractShopUpdater {

  constructor(
    @Inject('Upload') private readonly uploadService: UploadService,
    private readonly shopFacade: ShopFacade
  ) {

  }

  updateConfig(update: ShopConfigUpdate): Progress {
    shopName: string;
    shortDescription: string;
    description: string;
    keywords: string[];

    forkJoin({
      shopName: shop.shopName$,
      description: shop.description$,
      shortDescription: shop.isAdmin$,
      keywords: shop.identifier$
    }).subscribe(si => this.shopInfoService.resolveShop(si))
    this.shopFacade.

    this.uploadService.deployFiles();
  }
}