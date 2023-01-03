import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';
import { NetworkService } from 'src/app/core';

/**
 * Async form validator for correct network ID.
 * Must be placed in the service.
 */
function requireCorrectNetworkValidator(
  providerService: ProviderService,
  networkService: NetworkService,
): AsyncValidatorFn {

  return (control: AbstractControl): Observable<ValidationErrors | null> => {

    return providerService.chainId$.pipe(
      map(chainId => {
        const expectedNetwork = networkService.getExpectedNetwork();
        if (expectedNetwork.chainId !== chainId) {
          return { 'requireCorrectNetwork': true, 'msg': 'You are not on the expected network: ' + expectedNetwork.network };
        }

        return null;
      })
    );
  };
}

@Component({
  selector: 'w3s-step-confirm-usage',
  templateUrl: './step-confirm-usage.component.html',
  styleUrls: ['../new-shop.component.scss']
})
export class StepConfirmUsageComponent implements OnInit, OnDestroy {

  confirmForm: FormGroup;

  private formSub: Subscription;

  @Output()
  isValidEvent = new EventEmitter<boolean>();

  constructor(
    private readonly fb: FormBuilder
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
