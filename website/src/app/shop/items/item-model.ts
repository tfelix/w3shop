import { Injectable } from "@angular/core";
import { ShopItem, UriResolverService } from "src/app/core";
import { URL } from "src/app/shared";
import { Price, toPrice } from "../price/price";

export interface ItemModel {
  id: number;
  price: Price;
  mime: string;
  name: string;
  description: string;
  thumbnails: URL[];
  primaryThumbnail: URL;
}

@Injectable({
  providedIn: 'root'
})
export class ItemModelMapperService {

  constructor(
    private readonly uriResolverService: UriResolverService
  ) {
  }

  mapToItemModel(item: ShopItem): ItemModel {
    let primaryThumbnail: URL;

    if (item.thumbnails.length == 0) {
      // TODO Use a proper thumbnail
      primaryThumbnail = '';
    } else {
      primaryThumbnail = this.uriResolverService.toURL(item.thumbnails[0])
    }


    return {
      id: item.id,
      price: toPrice(item),
      mime: item.mime,
      name: item.name,
      description: item.description,
      thumbnails: item.thumbnails.map(uri => this.uriResolverService.toURL(uri)),
      primaryThumbnail
    }
  }
}