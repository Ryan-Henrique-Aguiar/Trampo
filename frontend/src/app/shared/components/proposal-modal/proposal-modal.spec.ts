import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalModal } from './proposal-modal';

describe('ProposalModal', () => {
  let component: ProposalModal;
  let fixture: ComponentFixture<ProposalModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
