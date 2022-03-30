import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MimeIconComponent } from './mime-icon.component';

describe('MimeIconComponent', () => {
  let component: MimeIconComponent;
  let fixture: ComponentFixture<MimeIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MimeIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MimeIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
