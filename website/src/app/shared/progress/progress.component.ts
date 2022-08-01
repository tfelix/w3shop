import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface Progress<T> {
  progress: number;
  text?: string;
  result: T | null;
}

@Component({
  selector: 'w3s-progress',
  templateUrl: './progress.component.html',
})
export class ProgressComponent implements OnChanges {

  @Input()
  public progress: Progress<any> | null;

  @Input()
  public header: string;

  text: string = '';
  progressWidth: string = '0%';
  isDisplayed = true;

  constructor() {
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.progress) {
      return;
    }
    this.isDisplayed = this.progress.result === null;
    this.text = this.progress.text || '';
    this.progressWidth = `${this.progress.progress}%`;
  }
}
