import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
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
import { PriceComponent } from './price/price.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FooterComponent } from './footer/footer.component';

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
    FooterComponent,
    ExternalLinkComponent,
    WizardComponent,
    WizardStepComponent,
    PriceComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    ClipboardModule,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    ClipboardModule,
    CommonModule,
    RouterModule,
    TooltipModule,
    ModalModule,
    KeywordsComponent,
    KeywordsEditorComponent,
    ProgressComponent,
    MimeIconComponent,
    BackButtonComponent,
    FooterComponent,
    TitleComponent,
    FileSizePipe,
    MarkedPipe,
    ExternalLinkComponent,
    ContractAddressComponent,
    WizardComponent,
    WizardStepComponent,
    PriceComponent
  ]
})
export class SharedModule { }
