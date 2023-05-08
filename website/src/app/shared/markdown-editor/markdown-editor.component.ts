import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';

@Component({
  selector: 'w3s-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss']
})
export class MarkdownEditorComponent implements OnInit {
  form!: FormGroup;

  formControlName: string = 'description';

  @Input()
  placeholder!: string;

  constructor(private rootFormGroup: FormGroupDirective) { }

  ngOnInit(): void {
    this.form = this.rootFormGroup.control;
  }

  public get description(): string {
    if (this.form) {
      return this.form.get(this.formControlName).value || 'No description given';
    } else {
      return '';
    }
  }
}
