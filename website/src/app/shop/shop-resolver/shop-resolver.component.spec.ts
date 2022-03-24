import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopResolverComponent } from './shop-resolver.component';

describe('ShopResolverComponent', () => {
  let component: ShopResolverComponent;
  let fixture: ComponentFixture<ShopResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShopResolverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
