import { Component, Input } from '@angular/core';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-external-link',
  templateUrl: './external-link.component.html',
  styleUrls: ['./external-link.component.scss']
})
export class ExternalLinkComponent {

  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  @Input()
  href: string;

  constructor() { }
}
