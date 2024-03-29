import { Component } from '@angular/core';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Observable, of } from 'rxjs';
import { pluck, tap } from 'rxjs/operators';
import { filterNotNull, Progress } from 'src/app/shared';
import { ItemDownloadService } from './item-download.service';
import { OwnedItem, OwnedItemsService } from './owned-items.service';

@Component({
  selector: 'w3s-owned-items',
  templateUrl: './owned-items.component.html',
  styleUrls: ['./owned-items.component.scss']
})
export class OwnedItemsComponent {

  faCartShopping = faCartShopping;
  progress$: Observable<Progress<OwnedItem[]>>;
  ownedItems$: Observable<OwnedItem[]> = of([]);
  noItems = true;

  constructor(
    private readonly ownedItemsService: OwnedItemsService,
    private readonly itemDownloadService: ItemDownloadService
  ) {
    this.refreshOwnedItems();
  }

  download(downloadItem: OwnedItem) {
    this.itemDownloadService.download(downloadItem).subscribe();
  }

  refreshOwnedItems() {
    this.progress$ = this.ownedItemsService.scanOwnedItems();
    this.ownedItems$ = this.progress$.pipe(
      pluck('result'),
      filterNotNull(),
      tap(x => this.noItems = x.length === 0),
      filterNotNull()
    );
  }
}
