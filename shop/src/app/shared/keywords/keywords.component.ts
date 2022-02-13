import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'w3s-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['keywords.component.scss']
})
export class KeywordsComponent {

  @Input()
  keywords: string[] = [];

  remove(i: number) {
    this.keywords.splice(i, 1);
  }
}
