import { Component, Input } from '@angular/core';

@Component({
  selector: 'w3s-title',
  templateUrl: './title.component.html'
})
export class TitleComponent {

  @Input()
  title!: string;
}
