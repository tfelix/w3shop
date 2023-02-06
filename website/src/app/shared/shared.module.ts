import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from 'ngx-clipboard';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { TabsModule } from 'ngx-bootstrap/tabs';

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
import { ModalModule } from 'ngx-bootstrap/modal';
import { FooterComponent } from './footer/footer.component';
import { DragDropFileUploadDirective } from './drag-drop-file-upload.directive';
import { MarkdownEditorComponent } from './markdown-editor/markdown-editor.component';
import { FileDropperComponent } from './file-dropper/file-dropper.component';
import { DeployStepComponent } from './deploy-steps/deploy-step/deploy-step.component';
import { DeployStepsComponent } from './deploy-steps/deploy-steps.component';
import { SuccessMessageComponent } from './success-message/success-message.component';

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
    SuccessMessageComponent,
    DragDropFileUploadDirective,
    DeployStepComponent,
    DeployStepsComponent,
    MarkdownEditorComponent,
    FileDropperComponent,
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
    SortableModule.forRoot(),
    TabsModule.forRoot(),
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
    SortableModule,
    TabsModule,
    KeywordsComponent,
    KeywordsEditorComponent,
    ProgressComponent,
    MimeIconComponent,
    BackButtonComponent,
    DeployStepsComponent,
    SuccessMessageComponent,
    FooterComponent,
    TitleComponent,
    FileSizePipe,
    MarkedPipe,
    ExternalLinkComponent,
    ContractAddressComponent,
    WizardComponent,
    WizardStepComponent,
    DragDropFileUploadDirective,
    MarkdownEditorComponent,
    FileDropperComponent
  ]
})
export class SharedModule { }
