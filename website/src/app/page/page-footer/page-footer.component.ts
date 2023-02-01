import { Component } from '@angular/core';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle, faFileContract, faGavel, faScrewdriverWrench, faSection, faUmbrella } from '@fortawesome/free-solid-svg-icons';
import { NetworkService } from 'src/app/core';
import { VERSION } from 'src/environments/version';

@Component({
  selector: 'w3s-page-footer',
  templateUrl: './page-footer.component.html',
  styleUrls: ['./page-footer.component.scss']
})
export class PageFooterComponent {

  faTwitter = faTwitter;
  faGithub = faGithub;
  faBook = faBook;
  faCircle = faCircle;
  faTools = faScrewdriverWrench;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faUmbrella = faUmbrella;
  faFileContract = faFileContract;
  faSection = faSection;
  faGavel = faGavel;

  websiteHash = `${VERSION.version} (${VERSION.hash || 'UNKNOWN'})`;
  factoryContract: string;

  constructor(
    private readonly networkService: NetworkService,
  ) {
    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
