import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Ticket } from '../../../models/ticket.model';
import { Proposal } from '../../../models/proposal.model';

import { TicketStatus } from '../../../enums/ticket-status';
import { ProposalStatus } from '../../../enums/proposal-status';
import { PaymentMethod } from '../../../enums/payment-method';
import { WeekDay } from '../../../enums/week-day';

import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { ProposalService } from '../../../services/proposal/proposal-service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css'
})
export class TicketDetail implements OnChanges {

  @Input() isOpen = false;
  @Input() ticket: Ticket | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<Ticket>();
  @Output() ticketUpdated = new EventEmitter<Ticket>();

  private static readonly TERMINAL_STATUSES = [
    TicketStatus.COMPLETED,
    TicketStatus.CANCELLED
  ];

  public paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  public dayOptions = [
    { label: 'Segunda', value: WeekDay.MONDAY },
    { label: 'Terça', value: WeekDay.TUESDAY },
    { label: 'Quarta', value: WeekDay.WEDNESDAY },
    { label: 'Quinta', value: WeekDay.THURSDAY },
    { label: 'Sexta', value: WeekDay.FRIDAY },
    { label: 'Sábado', value: WeekDay.SATURDAY },
    { label: 'Domingo', value: WeekDay.SUNDAY },
  ];

  public hourOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

  public isStatusMenuOpen = false;
  public pendingStatus: TicketStatus | null = null;
  public isChangingStatus = false;

  public isEditing = false;
  public isSaving = false;
  public editForm!: FormGroup;

  public proposals: Proposal[] = [];
  public isLoadingProposals = false;
  public isProposalFormOpen = false;
  public isSubmittingProposal = false;
  public processingProposalId: number | null = null;

  public proposalPriceControl = new FormControl<number | null>(
    null,
    [Validators.required, Validators.min(1)]
  );

  constructor(
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private ticketService: TicketService,
    private proposalService: ProposalService,
    private cdr: ChangeDetectorRef
  ) {}

  get isProviderMode(): boolean {
    return this.viewModeService.isProviderMode;
  }

  get isOwnTicket(): boolean {
    return !this.isProviderMode &&
      this.ticket?.userId === this.authService.currentUser?.id;
  }

  get canEdit(): boolean {
    return this.isOwnTicket &&
      this.ticket?.status === TicketStatus.OPEN;
  }

  get canChangeStatus(): boolean {
    return this.isOwnTicket && this.availableTransitions.length > 0;
  }

  get availableTransitions(): TicketStatus[] {
    if (!this.ticket) return [];

    return this.ticketService
      .getAvailableStatusTransitions(this.ticket.status)
      .filter(status => status !== TicketStatus.IN_PROGRESS);
  }

  get isPendingStatusIrreversible(): boolean {
    return this.pendingStatus !== null &&
      TicketDetail.TERMINAL_STATUSES.includes(this.pendingStatus);
  }

  get myProposal(): Proposal | null {
    const userId = this.authService.currentUser?.id;

    if (userId === undefined) return null;

    return this.proposals.find(
      proposal => proposal.professionalId === userId
    ) ?? null;
  }

  get canSendProposal(): boolean {
    return this.isProviderMode &&
      this.ticket?.status === TicketStatus.OPEN &&
      this.myProposal === null;
  }

  async ngOnChanges(): Promise<void> {
    if (this.isOpen && this.ticket) {
      await this.loadProposals(this.ticket.id);
    } else {
      this.proposals = [];
    }

    this.cdr.detectChanges();
  }

  private async loadProposals(ticketId: number): Promise<void> {
    this.isLoadingProposals = true;

    try {
      this.proposals = await this.proposalService.getByTicketId(ticketId);
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);
      this.proposals = [];
    } finally {
      this.isLoadingProposals = false;
      this.cdr.detectChanges();
    }
  }

  toggleStatusMenu(): void {
    if (!this.canChangeStatus) return;

    this.isStatusMenuOpen = !this.isStatusMenuOpen;
  }

  selectNewStatus(status: TicketStatus): void {
    this.isStatusMenuOpen = false;
    this.pendingStatus = status;
  }

  cancelStatusRequest(): void {
    this.pendingStatus = null;
  }

  async confirmStatusChange(): Promise<void> {
    if (!this.ticket || this.pendingStatus === null || this.isChangingStatus) {
      return;
    }

    this.isChangingStatus = true;

    try {
      const updatedTicket = await this.ticketService.updateStatus(
        this.ticket.id,
        this.ticket.status,
        this.pendingStatus
      );

      this.ticket = updatedTicket;
      this.pendingStatus = null;

      this.statusChanged.emit(updatedTicket);
      this.ticketUpdated.emit(updatedTicket);
    } catch (err) {
      console.error('Erro ao alterar status do ticket:', err);
    } finally {
      this.isChangingStatus = false;
      this.cdr.detectChanges();
    }
  }

  startEditing(): void {
    if (!this.ticket) return;

    this.editForm = new FormGroup({
      title: new FormControl(
        this.ticket.title,
        [Validators.required, Validators.maxLength(50)]
      ),
      description: new FormControl(
        this.ticket.description,
        [Validators.required, Validators.maxLength(500)]
      ),
      address: new FormGroup({
        street: new FormControl(
          this.ticket.address.street,
          [Validators.required]
        ),
        number: new FormControl(
          this.ticket.address.number,
          [Validators.required]
        ),
        neighborhood: new FormControl(
          this.ticket.address.neighborhood,
          [Validators.required]
        ),
        city: new FormControl(
          this.ticket.address.city,
          [Validators.required]
        ),
        state: new FormControl(
          this.ticket.address.state,
          [Validators.required, Validators.maxLength(2)]
        ),
        zipCode: new FormControl(this.ticket.address.zipCode),
        complement: new FormControl(this.ticket.address.complement),
      }),
      priceMax: new FormControl(
        this.ticket.priceMax,
        [Validators.required]
      ),
      paymentMethods: new FormControl(
        this.ticket.paymentMethods ?? [],
        [Validators.required]
      ),
      availableDays: new FormControl(
        this.ticket.availableDays ?? [],
        [Validators.required]
      ),
      availableHours: new FormControl(
        this.ticket.availableHours ?? [],
        [Validators.required]
      ),
    });

    this.isEditing = true;
    this.cdr.detectChanges();
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  isEditFieldInvalid(field: string): boolean {
    const control = this.editForm?.get(field);

    return !!control && control.invalid && control.touched;
  }

  isEditOptionSelected(field: string, value: unknown): boolean {
    const current = this.editForm?.get(field)?.value ?? [];

    return current.includes(value);
  }

  toggleEditOption(field: string, value: unknown): void {
    const current = this.editForm.get(field)?.value ?? [];

    const updated = current.includes(value)
      ? current.filter((item: unknown) => item !== value)
      : [...current, value];

    this.editForm.get(field)?.setValue(updated);
    this.editForm.get(field)?.markAsTouched();
  }

  async saveEdit(): Promise<void> {
    if (!this.ticket) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    if (this.isSaving) return;

    this.isSaving = true;

    try {
      const value = this.editForm.getRawValue();

      const updatedTicket = await this.ticketService.update(
        this.ticket.id,
        value
      );

      this.ticket = updatedTicket;
      this.isEditing = false;

      this.ticketUpdated.emit(updatedTicket);
    } catch (err) {
      console.error('Erro ao atualizar ticket:', err);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openProposalForm(): void {
    this.isProposalFormOpen = true;
  }

  cancelProposalForm(): void {
    this.isProposalFormOpen = false;
    this.proposalPriceControl.reset();
  }

  async submitProposal(): Promise<void> {
    if (!this.ticket || this.proposalPriceControl.invalid) {
      this.proposalPriceControl.markAsTouched();
      return;
    }

    if (this.isSubmittingProposal) return;

    this.isSubmittingProposal = true;

    try {
      const createdProposal = await this.proposalService.create({
        priceRange: this.proposalPriceControl.value!,
        ticketId: this.ticket.id
      });

      this.proposals = [...this.proposals, createdProposal];

      await this.bumpProposalsCount();

      this.isProposalFormOpen = false;
      this.proposalPriceControl.reset();

      this.closeModal();
    } catch (err) {
      console.error('Erro ao enviar proposta:', err);
    } finally {
      this.isSubmittingProposal = false;
      this.cdr.detectChanges();
    }
  }

  private async bumpProposalsCount(): Promise<void> {
    if (!this.ticket) return;

    const newCount = (this.ticket.proposalsCount ?? 0) + 1;

    try {
      const updatedTicket = await this.ticketService.update(
        this.ticket.id,
        { proposalsCount: newCount }
      );

      this.ticket = updatedTicket;
      this.ticketUpdated.emit(updatedTicket);
    } catch (err) {
      console.error('Erro ao atualizar contagem de propostas:', err);
    }
  }

  async onAcceptProposal(proposal: Proposal): Promise<void> {
    if (this.processingProposalId !== null || !this.ticket) return;

    this.processingProposalId = proposal.id;

    try {
      await this.proposalService.accept(proposal);

      const updatedTicket = await this.ticketService.updateStatus(
        this.ticket.id,
        this.ticket.status,
        TicketStatus.IN_PROGRESS
      );

      this.ticket = updatedTicket;
      this.ticketUpdated.emit(updatedTicket);

      await this.rejectRemainingPending(proposal.id);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
    } finally {
      this.processingProposalId = null;
      this.cdr.detectChanges();
    }
  }

  private async rejectRemainingPending(
    acceptedProposalId: number
  ): Promise<void> {
    if (!this.ticket) return;

    const others = this.proposals.filter(
      proposal =>
        proposal.id !== acceptedProposalId &&
        proposal.status === ProposalStatus.PENDING
    );

    if (others.length > 0) {
      const results = await Promise.allSettled(
        others.map(proposal =>
          this.proposalService.reject(proposal)
        )
      );

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error(
            'Erro ao rejeitar proposta concorrente:',
            result.reason
          );
        }
      });
    }

    await this.loadProposals(this.ticket.id);
  }

  async onRejectProposal(proposal: Proposal): Promise<void> {
    if (this.processingProposalId !== null || !this.ticket) return;

    this.processingProposalId = proposal.id;

    try {
      await this.proposalService.reject(proposal);

      await this.loadProposals(this.ticket.id);
    } catch (err) {
      console.error('Erro ao rejeitar proposta:', err);
    } finally {
      this.processingProposalId = null;
      this.cdr.detectChanges();
    }
  }

  getProposalStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada',
    };

    return labels[status] || status;
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };

    return labels[status] || 'Desconhecido';
  }

  getStatusClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'status-open',
      [TicketStatus.IN_PROGRESS]: 'status-progress',
      [TicketStatus.COMPLETED]: 'status-completed',
      [TicketStatus.CANCELLED]: 'status-cancelled'
    };

    return classes[status] || 'status-default';
  }

  getDayLabel(day: string): string {
    const labels: Record<WeekDay, string> = {
      [WeekDay.MONDAY]: 'Segunda',
      [WeekDay.TUESDAY]: 'Terça',
      [WeekDay.WEDNESDAY]: 'Quarta',
      [WeekDay.THURSDAY]: 'Quinta',
      [WeekDay.FRIDAY]: 'Sexta',
      [WeekDay.SATURDAY]: 'Sábado',
      [WeekDay.SUNDAY]: 'Domingo',
    };

    return labels[day as WeekDay] || day;
  }

  closeModal(): void {
    this.isStatusMenuOpen = false;
    this.pendingStatus = null;
    this.isEditing = false;
    this.isProposalFormOpen = false;
    this.proposalPriceControl.reset();

    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  formatDate(date: string): string {
    if (!date) return '';

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatList(list: string[] | undefined): string {
    if (!list || list.length === 0) {
      return 'Não informado';
    }

    return list.join(' • ');
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) {
      return 'Não informado';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}