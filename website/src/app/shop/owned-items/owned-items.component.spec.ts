import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnedItemsComponent } from './owned-items.component';

describe('OwnedItemsComponent', () => {
  let component: OwnedItemsComponent;
  let fixture: ComponentFixture<OwnedItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OwnedItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OwnedItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
