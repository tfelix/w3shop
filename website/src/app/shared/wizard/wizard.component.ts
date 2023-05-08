import { AfterContentInit, Component, ContentChildren, EventEmitter, Output, QueryList } from '@angular/core';
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
  isBackDisabled: boolean = false;

  @Output()
  nextStepEvent = new EventEmitter<number>();

  @ContentChildren(WizardStepComponent) private wizardSteps!: QueryList<WizardStepComponent>;

  ngAfterContentInit(): void {
    if (this.wizardSteps.length > 0) {
      this.wizardSteps.get(0)!.isVisible = true;
    }
    this.totalSteps = this.wizardSteps.length;
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();

    this.nextStepEvent.emit(this.currentStep);
  }

  disableBack(value: boolean) {
    this.isBackDisabled = value;
  }

  canExit(): boolean {
    const currentStep = this.wizardSteps.get(this.currentStep);

    return currentStep?.canExit || false;
  }

  next() {
    if (this.currentStep >= this.wizardSteps.length) {
      return;
    }

    this.currentStep++;
    this.setStepVisibility(this.currentStep - 1);
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();
    this.nextStepEvent.emit(this.currentStep);
  }

  prev() {
    if (this.currentStep === 0) {
      return;
    }

    this.currentStep--;
    this.setStepVisibility(this.currentStep + 1);
    this.checkStepExistence();
    this.updateDetailsFromCurrentStep();
    this.nextStepEvent.emit(this.currentStep);
  }

  private setStepVisibility(prevStep: number) {
    let step = this.wizardSteps.get(prevStep);
    if (step) {
      step.isVisible = false;
    }

    step = this.wizardSteps.get(this.currentStep);
    if (step) {
      step.isVisible = true;
    }
  }

  private updateDetailsFromCurrentStep() {
    const currentStep = this.wizardSteps.get(this.currentStep);

    if (!currentStep) {
      return;
    }

    this.currentStepName = currentStep.name;
  }

  private checkStepExistence() {
    this.hasNextStep = this.currentStep + 1 < this.wizardSteps.length;
    this.hasPrevStep = this.currentStep > 0;
  }
}
