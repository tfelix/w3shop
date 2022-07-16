import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Progress } from 'src/app/shared';
import { OwnedItem, OwnedItemsService } from './owned-items.service';

@Component({
  selector: 'w3s-owned-items',
  templateUrl: './owned-items.component.html',
  styleUrls: ['./owned-items.component.scss']
})
export class OwnedItemsComponent implements OnInit {

  progress$: Observable<Progress> | null = null;
  ownedItems$: Observable<OwnedItem[] | null>;

  constructor(
    private readonly ownedItemsService: OwnedItemsService
  ) {
    this.ownedItems$ = this.ownedItemsService.ownedItems$;
  }

  ngOnInit(): void {
    this.refreshOwnedItems();
  }

  download(item: OwnedItem) {
    // Get the file payload URL from NFT metadata
    // Load the file content
    // descript it with Lit
    // Save on user PC
    console.log('Not implemented');
  }

  refreshOwnedItems() {
    this.progress$ = this.ownedItemsService.scanOwnedItems().pipe(tap(x => console.log(x)));
  }
}
