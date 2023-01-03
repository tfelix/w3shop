import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { DeployStepService, Step, StepState } from './deploy-step.service';

@Component({
  selector: 'w3s-deploy-steps',
  templateUrl: './deploy-steps.component.html',
  styleUrls: ['deploy-steps.component.scss']
})
export class DeployStepsComponent {
  StepState = StepState;

  readonly steps$: Observable<Step[]>;

  constructor(
    private readonly stepService: DeployStepService
  ) {
    this.steps$ = this.stepService.steps$;
  }
}
