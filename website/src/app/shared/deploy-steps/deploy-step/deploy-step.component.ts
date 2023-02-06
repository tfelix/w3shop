/* eslint-disable  @angular-eslint/component-selector*/

import { Component, Input } from '@angular/core';
import { faBarsProgress, faCancel, faCheck, faCircleExclamation, faExclamationTriangle, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { DeployStepService, Step, StepState } from '../deploy-step.service';

@Component({
  selector: '[w3s-deploy-step]',
  templateUrl: './deploy-step.component.html',
  styleUrls: ['deploy-step.component.scss'],
})
export class DeployStepComponent {
  // Export to use enum inside  of template
  StepState = StepState;

  faIconWaiting = faBarsProgress;
  faIconPending = faHourglassHalf;
  faIconSuccess = faCheck;
  faIconSkipped = faCancel;
  faIconFailed = faCircleExclamation;

  faWarning = faExclamationTriangle;

  @Input()
  step: Step;

  @Input()
  n: number;

  disabledReason$: Observable<string | null>;

  constructor(
    private stepService: DeployStepService
  ) {
    this.disabledReason$ = this.stepService.disabledReason$;
  }

  clickButton() {
    this.stepService.clickedStepButton(this.n);
  }
}
