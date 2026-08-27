import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProposalsModal } from './proposal-modal';

describe('ProposalsModal', () => {
  let component: ProposalsModal;
  let fixture: ComponentFixture<ProposalsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalsModal],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
