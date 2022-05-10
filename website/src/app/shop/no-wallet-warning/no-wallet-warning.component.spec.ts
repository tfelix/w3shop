import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoWalletWarningComponent } from './no-wallet-warning.component';

describe('NoWalletWarningComponent', () => {
  let component: NoWalletWarningComponent;
  let fixture: ComponentFixture<NoWalletWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoWalletWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoWalletWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
