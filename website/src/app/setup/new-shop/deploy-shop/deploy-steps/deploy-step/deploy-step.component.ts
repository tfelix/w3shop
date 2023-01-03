import { Component, Input } from '@angular/core';
import { faBarsProgress, faCancel, faCheck, faCircleExclamation, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { DeployStepService, Step, StepState } from '../deploy-step.service';

@Component({
  selector: "[w3s-deploy-step]",
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

  @Input()
  step: Step;

  @Input()
  n: number;

  constructor(
    private stepService: DeployStepService
  ) {
  }

  clickButton() {
    this.stepService.clickedStepButton(this.n);
  }
}
