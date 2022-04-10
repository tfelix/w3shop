import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ShopDeploy } from '../deploy-shop.service';

@Component({
  selector: 'w3s-deploy-progress',
  templateUrl: './deploy-progress.component.html',
})
export class DeployProgressComponent implements OnChanges {

  @Input()
  public deployProgress: Observable<ShopDeploy>;

  private deploySub: Subscription;

  text: string = '';
  progressWidth: string = '0%';

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.deploySub) {
      this.deploySub.unsubscribe();
    }

    this.deploySub = this.deployProgress.subscribe(
      x => this.processDeployProgress(x),
      err => { this.deploySub.unsubscribe(); },
      () => { this.deploySub.unsubscribe(); }
    );
  }

  private processDeployProgress(progress: ShopDeploy) {
    console.debug(progress);
    this.text = progress.stage;
    this.progressWidth = `${progress.progress}%`;
  }
}
