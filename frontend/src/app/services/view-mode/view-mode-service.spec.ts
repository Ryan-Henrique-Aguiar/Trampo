import { TestBed } from '@angular/core/testing';

import { ViewModeService } from './view-mode-service';

describe('ViewModeService', () => {
  let service: ViewModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
