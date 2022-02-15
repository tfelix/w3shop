import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KeywordsComponent } from './keywords/keywords.component';
import { KeywordsEditorComponent } from './keywords-editor/keywords-editor.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    KeywordsComponent,
    KeywordsEditorComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [
    KeywordsComponent,
    KeywordsEditorComponent,
    FontAwesomeModule
  ]
})
export class SharedModule { }
