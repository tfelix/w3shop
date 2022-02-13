import { Component, Input, OnInit } from '@angular/core';
import { CollectionId } from 'src/app/shared';

@Component({
  selector: 'w3s-related-collections',
  templateUrl: './related-collections.component.html',
})
export class RelatedCollectionsComponent implements OnInit {

  @Input()
  activeCollection: CollectionId | null = null;

  constructor() { }

  ngOnInit(): void {
  }

}
