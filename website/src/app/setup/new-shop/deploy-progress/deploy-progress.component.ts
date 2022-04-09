import { Component, Input } from '@angular/core';
import { DeployResult } from '../deploy-shop.service';

@Component({
  selector: 'w3s-deploy-progress',
  templateUrl: './deploy-progress.component.html',
})
export class DeployProgressComponent {

  @Input()
  public deployProgress: DeployResult;

  text: string = '';
  progressWidth: string = '25%';

  constructor(

  ) {
  }
}
