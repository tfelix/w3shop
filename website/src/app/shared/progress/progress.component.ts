import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

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
  public progress: Observable<Progress>;

  @Input()
  public header: string;

  private deploySub: Subscription;

  text: string = '';
  progressWidth: string = '0%';

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.deploySub) {
      this.deploySub.unsubscribe();
    }

    this.deploySub = this.progress.subscribe(
      x => this.processDeployProgress(x),
      _ => { this.deploySub.unsubscribe(); },
      () => { this.deploySub.unsubscribe(); }
    );
  }

  private processDeployProgress(progress: Progress) {
    this.text = progress.text || '';
    this.progressWidth = `${progress.progress}%`;
  }
}
