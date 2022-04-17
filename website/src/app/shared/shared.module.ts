import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { NgWizardModule, NgWizardConfig, THEME } from 'ng-wizard';

import { KeywordsComponent } from './keywords/keywords.component';
import { KeywordsEditorComponent } from './keywords-editor/keywords-editor.component';
import { FileSizePipe } from './file-size.pipe';
import { MimeIconComponent } from './mime-icon/mime-icon.component';
import { ProgressComponent } from './progress/progress.component';

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
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    NgWizardModule.forRoot(ngWizardConfig)
  ],
  exports: [
    KeywordsComponent,
    KeywordsEditorComponent,
    ProgressComponent,
    MimeIconComponent,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgWizardModule,
    CommonModule,
    RouterModule,
    FileSizePipe
  ]
})
export class SharedModule { }
