import { Component, Input, OnInit } from '@angular/core';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { BrowserNavigationService } from 'src/app/core';

@Component({
  selector: 'w3s-back-btn',
  templateUrl: './back-button.component.html',
})
export class BackButtonComponent implements OnInit {

  @Input()
  relPath?: string;

  faChevronLeft = faChevronLeft;

  routerPath: string;

  constructor(private navigation: BrowserNavigationService) {}

  ngOnInit(): void {
    if (this.relPath) {
      this.routerPath = this.relPath;
    } else {
      this.routerPath = '..';
    }
  }

  back(): void {
    this.navigation.back();
  }
}
