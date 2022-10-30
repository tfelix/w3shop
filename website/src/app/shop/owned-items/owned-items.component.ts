import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { filterNotNull, Progress } from 'src/app/shared';
import { OwnedItem, OwnedItemsService } from './owned-items.service';

@Component({
  selector: 'w3s-owned-items',
  templateUrl: './owned-items.component.html',
  styleUrls: ['./owned-items.component.scss']
})
export class OwnedItemsComponent {

  progress$: Observable<Progress<OwnedItem[]>> | null = null;
  ownedItems$: Observable<OwnedItem[]>;

  constructor(
    private readonly ownedItemsService: OwnedItemsService,
  ) {
    this.refreshOwnedItems();
  }

  download(item: OwnedItem) {
    // this.nftDownloadService.downloadOwnedFile(item.nft);
  }

  refreshOwnedItems() {
    this.progress$ = this.ownedItemsService.scanOwnedItems();
    this.ownedItems$ = this.progress$.pipe(
      pluck('result'),
      filterNotNull()
    );
  }
}
