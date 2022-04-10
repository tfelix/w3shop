import { Component } from '@angular/core';
import { faChevronRight, faHeart } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  faHeart = faHeart;
  faChevronRight = faChevronRight;
}
