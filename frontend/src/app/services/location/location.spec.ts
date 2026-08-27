import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LocationService } from './location';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
