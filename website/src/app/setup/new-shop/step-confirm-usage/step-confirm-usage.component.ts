import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'w3s-step-confirm-usage',
  templateUrl: './step-confirm-usage.component.html',
  styleUrls: ['../new-shop.component.scss']
})
export class StepConfirmUsageComponent implements OnInit, OnDestroy {

  confirmForm: UntypedFormGroup;

  private formSub: Subscription;

  @Output()
  isValidEvent = new EventEmitter<boolean>();

  constructor(
    private readonly fb: UntypedFormBuilder
  ) {
    this.confirmForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue],
      acceptUsage: [false, Validators.requiredTrue],
    });

    this.formSub = this.confirmForm.statusChanges.subscribe(() => {
      this.isValidEvent.emit(this.confirmForm.valid);
    });
  }

  ngOnInit(): void {
    this.isValidEvent.emit(this.confirmForm.valid);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
  }
}
