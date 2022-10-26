import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavWalletComponent } from './nav-wallet.component';

describe('NavWalletComponent', () => {
  let component: NavWalletComponent;
  let fixture: ComponentFixture<NavWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
