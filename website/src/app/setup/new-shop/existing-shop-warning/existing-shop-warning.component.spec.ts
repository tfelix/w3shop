import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExistingShopWarningComponent } from './existing-shop-warning.component';

describe('ExistingShopWarningComponent', () => {
  let component: ExistingShopWarningComponent;
  let fixture: ComponentFixture<ExistingShopWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExistingShopWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExistingShopWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
