import { AfterContentInit, AfterViewInit, Component, ContentChildren, OnInit, QueryList, ViewChildren } from '@angular/core';
import { WizardStepComponent } from './wizard-step/wizard-step.component';

@Component({
  selector: 'w3s-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})
export class WizardComponent implements AfterContentInit {

  currentStep = 0;
  totalSteps = 0;
  currentStepName: string = 'Basic Information';

  hasNextStep: boolean = false;
  hasPrevStep: boolean = false;

  @ContentChildren(WizardStepComponent) private wizardSteps: QueryList<WizardStepComponent>;

  ngAfterContentInit(): void {
    if (this.wizardSteps.length > 0) {
      this.wizardSteps.get(0).isVisible = true;
    }
    this.totalSteps = this.wizardSteps.length;
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();
  }

  next() {
    if (this.currentStep >= this.wizardSteps.length) {
      return;
    }

    this.currentStep++;
    this.setStepVisibility(this.currentStep - 1);
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();
  }

  prev() {
    if (this.currentStep === 0) {
      return;
    }

    this.currentStep--;
    this.setStepVisibility(this.currentStep + 1);
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();
  }

  private setStepVisibility(prevStep: number) {
    this.wizardSteps.get(prevStep).isVisible = false;
    this.wizardSteps.get(this.currentStep).isVisible = true;
  }

  private updateDetailsFromCurrentStep() {
    const currentStep = this.wizardSteps.get(this.currentStep)

    this.currentStepName = currentStep.name;
  }

  private checkStepExistence() {
    this.hasNextStep = this.currentStep + 1 < this.wizardSteps.length;
    this.hasPrevStep = this.currentStep > 0;
  }
}
