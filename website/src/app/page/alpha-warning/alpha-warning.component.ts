import { Component } from '@angular/core';

import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { NetworkService } from 'src/app/core';

@Component({
  selector: 'w3s-alpha-warning',
  templateUrl: './alpha-warning.component.html',
})
export class AlphaWarningComponent {
  faTriangleExclamation = faTriangleExclamation;

  isDevelopment: boolean;

  constructor(
    networkService: NetworkService
  ) {
    this.isDevelopment = networkService.getExpectedNetwork().isDevelopment;
  }
}
