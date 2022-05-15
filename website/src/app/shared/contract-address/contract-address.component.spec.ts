import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractAddressComponent } from './contract-address.component';

describe('ContractAddressComponent', () => {
  let component: ContractAddressComponent;
  let fixture: ComponentFixture<ContractAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContractAddressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
