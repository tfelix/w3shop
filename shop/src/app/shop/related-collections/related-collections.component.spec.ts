import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedCollectionsComponent } from './related-collections.component';

describe('RelatedCollectionsComponent', () => {
  let component: RelatedCollectionsComponent;
  let fixture: ComponentFixture<RelatedCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedCollectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
