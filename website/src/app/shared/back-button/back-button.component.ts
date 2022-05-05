import { Component } from '@angular/core';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-back-btn',
  templateUrl: './back-button.component.html',
})
export class BackButtonComponent {

  faChevronLeft = faChevronLeft;
}
