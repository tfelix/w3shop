import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeywordsEditorComponent } from './keywords-editor.component';

describe('KeywordsEditorComponent', () => {
  let component: KeywordsEditorComponent;
  let fixture: ComponentFixture<KeywordsEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KeywordsEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeywordsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
