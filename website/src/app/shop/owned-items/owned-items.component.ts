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
    private readonly ownedItemsService: OwnedItemsService
  ) {
    this.refreshOwnedItems();
  }

  download(item: OwnedItem) {
    // Get the file payload URL from NFT metadata
    // Load the file content
    // descript it with Lit
    // Save on user PC
    console.log(item);
  }

  refreshOwnedItems() {
    this.progress$ = this.ownedItemsService.scanOwnedItems();
    this.ownedItems$ = this.progress$.pipe(
      pluck('result'),
      filterNotNull()
    );
  }
}
