import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-footer-link',
  templateUrl: './footer-link.component.html',
  styleUrls: ['./footer-link.component.scss']
})
export class FooterLinkComponent {

  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  @Input()
  href: string;

  @Input()
  icon?: IconDefinition;

  @Input()
  text: string;

  @Input()
  isExternal: boolean = true;

}
