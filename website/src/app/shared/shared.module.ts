import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { KeywordsComponent } from './keywords/keywords.component';
import { KeywordsEditorComponent } from './keywords-editor/keywords-editor.component';
import { FileSizePipe } from './file-size.pipe';
import { MimeIconComponent } from './mime-icon/mime-icon.component';


@NgModule({
  declarations: [
    KeywordsComponent,
    KeywordsEditorComponent,
    MimeIconComponent,
    FileSizePipe,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    KeywordsComponent,
    KeywordsEditorComponent,
    MimeIconComponent,
    ReactiveFormsModule,
    FontAwesomeModule,
    CommonModule,
    FileSizePipe
  ]
})
export class SharedModule { }
