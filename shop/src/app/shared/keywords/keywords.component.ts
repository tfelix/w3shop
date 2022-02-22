import { Component, Input } from '@angular/core';


import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['keywords.component.scss']
})
export class KeywordsComponent {

  faTrashCan = faTrashCan;

  @Input()
  keywords: string[] = [];

  remove(i: number) {
    this.keywords.splice(i, 1);
  }
}
