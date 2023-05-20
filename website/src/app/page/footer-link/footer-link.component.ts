import { Component, Input, OnInit } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-footer-link',
  templateUrl: './footer-link.component.html',
  styleUrls: ['./footer-link.component.scss']
})
export class FooterLinkComponent implements OnInit {

  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  @Input()
  href!: string;

  @Input()
  routerLink?: string;

  @Input()
  icon?: IconDefinition;

  @Input()
  text!: string;

  isExternal: boolean = true;

  ngOnInit(): void {
    this.isExternal = !this.routerLink;
  }
}
