import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandsComponent } from './stands.component';

describe('StandsComponent', () => {
  let component: StandsComponent;
  let fixture: ComponentFixture<StandsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});