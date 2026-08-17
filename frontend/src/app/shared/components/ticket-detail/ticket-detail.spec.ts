import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketDetail } from './ticket-detail';

describe('TicketDetail', () => {
  let component: TicketDetail;
  let fixture: ComponentFixture<TicketDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
