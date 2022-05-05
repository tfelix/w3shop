import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface Progress {
  progress: number;
  text?: string;
}

@Component({
  selector: 'w3s-progress',
  templateUrl: './progress.component.html',
})
export class ProgressComponent implements OnChanges {

  @Input()
  public progress: Progress | null;

  @Input()
  public header: string;

  text: string = '';
  progressWidth: string = '0%';

  constructor() {
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.progress) {
      return;
    }
    this.text = this.progress.text || '';
    this.progressWidth = `${this.progress.progress}%`;
  }
}
