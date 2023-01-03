import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, Subject, throwError } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";

export interface StepDescription {
  title: string;
  buttonText: string;
  text: string;
  errorText?: string;
}

export enum StepState {
  SKIPPED,
  SUCCESS,
  PENDING,
  WAITING,
  FAILED
}

export interface Step extends StepDescription {
  state: StepState;
  isTxPending: boolean;
  errorText: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeployStepService {

  private steps = new BehaviorSubject<Step[]>([]);
  steps$ = this.steps.asObservable();

  private executeStep = new Subject<number>();
  executeStep$ = this.executeStep.asObservable();

  setSteps(stepDescriptions: StepDescription[]) {
    const newSteps = stepDescriptions.map(s => {
      return {
        ...s,
        state: StepState.WAITING,
        isTxPending: false,
        errorText: s.errorText || 'There was an error while executing this step.'
      };
    });

    if (newSteps.length > 0) {
      newSteps[0].state = StepState.PENDING;
    }

    this.steps.next(newSteps);
  }

  setStepState(n: number, newState: StepState) {
    this.requireValidN(n);

    const steps = this.steps.value;

    steps[n].state = newState;

    this.steps.next(steps);
  }

  setStepErrorMessage(
    n: number,
    errorMessage: string,
    errorText?: string
  ) {
    this.requireValidN(n);

    const steps = this.steps.value;

    steps[n].errorMessage = errorMessage;
    if (errorText) {
      steps[n].errorText = errorText;
    }

    this.steps.next(steps);
  }

  clickedStepButton(n: number) {
    this.requireValidN(n);

    // In case we we're in error mode switch to pending of the currently pressed
    // button.
    this.setStepState(n, StepState.PENDING);

    this.executeStep.next(n);
  }

  setStepExecution<T>(n: number, obs$: Observable<T>): Observable<T> {
    return of(1).pipe(
      tap(() => this.startLoading(n)),
      mergeMap(() => obs$),
      tap(() => this.endLoading(n)),
      catchError(err => {
        this.endLoading(n);
        this.setStepState(n, StepState.FAILED);

        return throwError(err);
      })
    );
  }

  private startLoading(n: number) {
    const updatedSteps = this.steps.value;
    updatedSteps[n].isTxPending = true;
    this.steps.next(updatedSteps);
  }

  private endLoading(n: number) {
    const updatedSteps = this.steps.value;
    updatedSteps[n].isTxPending = false;
    this.steps.next(updatedSteps);
  }

  private requireValidN(n: number) {
    if (n < 0 || n >= this.steps.value.length) {
      throw new Error('n must be between 0 and step count of ' + this.steps.value.length);
    }
  }
}