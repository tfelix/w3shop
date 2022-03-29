import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { KeywordsComponent } from './keywords/keywords.component';
import { KeywordsEditorComponent } from './keywords-editor/keywords-editor.component';


@NgModule({
  declarations: [
    KeywordsComponent,
    KeywordsEditorComponent
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
    ReactiveFormsModule,
    FontAwesomeModule,
    CommonModule
  ]
})
export class SharedModule { }
