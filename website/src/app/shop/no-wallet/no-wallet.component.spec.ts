import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoWalletComponent } from './no-wallet.component';

describe('NoWalletComponent', () => {
  let component: NoWalletComponent;
  let fixture: ComponentFixture<NoWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
