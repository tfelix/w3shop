import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { NgWizardModule, NgWizardConfig, THEME } from 'ng-wizard';
import { ClipboardModule } from 'ngx-clipboard';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { KeywordsComponent } from './keywords/keywords.component';
import { KeywordsEditorComponent } from './keywords-editor/keywords-editor.component';
import { FileSizePipe } from './file-size.pipe';
import { MimeIconComponent } from './mime-icon/mime-icon.component';
import { ProgressComponent } from './progress/progress.component';
import { BackButtonComponent } from './back-button/back-button.component';
import { TitleComponent } from './title/title.component';
import { ContractAddressComponent } from './contract-address/contract-address.component';
import { ExternalLinkComponent } from './external-link/external-link.component';
import { WizardComponent } from './wizard/wizard.component';
import { WizardStepComponent } from './wizard/wizard-step/wizard-step.component';
import { MarkedPipe } from './marked.pipe';


const ngWizardConfig: NgWizardConfig = {
  theme: THEME.dots
};

@NgModule({
  declarations: [
    KeywordsComponent,
    KeywordsEditorComponent,
    ProgressComponent,
    MimeIconComponent,
    FileSizePipe,
    MarkedPipe,
    BackButtonComponent,
    TitleComponent,
    ContractAddressComponent,
    ExternalLinkComponent,
    WizardComponent,
    WizardStepComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    TooltipModule.forRoot(),
    NgWizardModule.forRoot(ngWizardConfig),
    ClipboardModule,
  ],
  exports: [
    ReactiveFormsModule,
    FontAwesomeModule,
    NgWizardModule,
    ClipboardModule,
    CommonModule,
    RouterModule,
    TooltipModule,
    KeywordsComponent,
    KeywordsEditorComponent,
    ProgressComponent,
    MimeIconComponent,
    BackButtonComponent,
    TitleComponent,
    FileSizePipe,
    MarkedPipe,
    ExternalLinkComponent,
    ContractAddressComponent,
    WizardComponent,
    WizardStepComponent
  ]
})
export class SharedModule { }
