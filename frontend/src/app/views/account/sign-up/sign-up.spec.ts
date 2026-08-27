import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';

import { SignUp } from './sign-up';
import { LocationService } from '../../../services/location/location';
import { CategoryService } from '../../../services/category/category-service';

describe('SignUp', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUp],
      providers: [
        provideRouter([]),
        {
          provide: LocationService,
          useValue: {
            getStates: () => Promise.resolve([]),
            getCities: () => Promise.resolve([])
          }
        },
        {
          provide: CategoryService,
          useValue: { getAll: () => Promise.resolve([]) }
        },
        {
          provide: ToastrService,
          useValue: { success: () => undefined, error: () => undefined }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
