import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignIn } from './sign-in';

describe('SignIn', () => {
  let component: SignIn;
  let fixture: ComponentFixture<SignIn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignIn],
    }).compileComponents();

    fixture = TestBed.createComponent(SignIn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
