import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'w3s-keywords-editor',
  templateUrl: './keywords-editor.component.html',
})
export class KeywordsEditorComponent {

  @Input()
  keywords: string[] = [];

  onKeypressEvent(input: HTMLInputElement) {
    if (!input.value.endsWith(' ')) {
      return;
    }

    this.keywords.push(input.value);
    input.value = '';
  }
}
