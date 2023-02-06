import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileDropperComponent } from './file-dropper.component';

describe('FileDropperComponent', () => {
  let component: FileDropperComponent;
  let fixture: ComponentFixture<FileDropperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileDropperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileDropperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
