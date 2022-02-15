import { Component } from '@angular/core';

import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-alpha-warning',
  templateUrl: './alpha-warning.component.html',
})
export class AlphaWarningComponent {
  faTriangleExclamation = faTriangleExclamation;
}
