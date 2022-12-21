import { Component, Input } from '@angular/core';

@Component({
  selector: 'w3s-wizard-step',
  templateUrl: './wizard-step.component.html'
})
export class WizardStepComponent {

  @Input()
  name: string;

  isVisible: boolean = false;

  @Input()
  canNext: boolean = true;
}
