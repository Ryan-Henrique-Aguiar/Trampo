import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Ticket } from '../../../models/ticket.model';
import { Proposal } from '../../../models/proposal.model';
import { TicketStatus } from '../../../enums/ticket-status';
import { ProposalStatus } from '../../../enums/proposal-status';
import { PaymentMethod } from '../../../enums/payment-method';
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { ProposalService } from '../../../services/proposal/proposal-service';
import { WeekDay } from '../../../enums/week-day';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail implements OnChanges {
  @Input() isOpen = false;
  @Input() ticket: Ticket | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<Ticket>();
  @Output() ticketUpdated = new EventEmitter<Ticket>();

  private authService = inject(AuthService);
  private viewModeService = inject(ViewModeService);
  private ticketService = inject(TicketService);
  private proposalService = inject(ProposalService);

  private static readonly TERMINAL_STATUSES = [TicketStatus.COMPLETED, TicketStatus.CANCELLED];

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

  public isStatusMenuOpen = signal(false);
  public pendingStatus = signal<TicketStatus | null>(null);
  public isChangingStatus = signal(false);

  public isEditing = signal(false);
  public isSaving = signal(false);
  public editForm!: FormGroup;

  // ===== PROPOSTAS =====
  public proposals = signal<Proposal[]>([]);
  public isLoadingProposals = signal(false);
  public isProposalFormOpen = signal(false);
  public isSubmittingProposal = signal(false);
  public proposalPriceControl = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);
  public processingProposalId = signal<number | null>(null);

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  get isOwnTicket(): boolean {
    return !this.isProviderMode && this.ticket?.userId === this.authService.userId;
  }

  get canEdit(): boolean {
    return this.isOwnTicket && this.ticket?.status === TicketStatus.OPEN;
  }

  get canChangeStatus(): boolean {
    return this.isOwnTicket && this.availableTransitions.length > 0;
  }

  get availableTransitions(): TicketStatus[] {
    if (!this.ticket) return [];
    return this.ticketService.getAvailableStatusTransitions(this.ticket.status)
      .filter(status => status !== TicketStatus.IN_PROGRESS);
  }

  get isPendingStatusIrreversible(): boolean {
    const status = this.pendingStatus();
    return status !== null && TicketDetail.TERMINAL_STATUSES.includes(status);
  }

  // proposta que o prestador logado já enviou pra esse ticket, se existir
  get myProposal(): Proposal | null {
    const userId = this.authService.userId;
    return this.proposals().find(p => p.professionalId === userId) ?? null;
  }

  get canSendProposal(): boolean {
    return this.isProviderMode
      && this.ticket?.status === TicketStatus.OPEN
      && this.myProposal === null;
  }

  // ===== CICLO DE VIDA =====

  ngOnChanges(): void {
    if (this.isOpen && this.ticket) {
      this.loadProposals(this.ticket.id);
    } else {
      this.proposals.set([]);
    }
  }

  private loadProposals(ticketId: number): void {
    this.isLoadingProposals.set(true);
    this.proposalService.getByTicketId(ticketId).subscribe({
      next: (proposals) => {
        this.proposals.set(proposals);
        this.isLoadingProposals.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao carregar propostas:', err);
        this.proposals.set([]);
        this.isLoadingProposals.set(false);
      },
    });
  }

  // ===== STATUS =====

  toggleStatusMenu(): void {
    if (!this.canChangeStatus) return;
    this.isStatusMenuOpen.update(open => !open);
  }

  selectNewStatus(status: TicketStatus): void {
    this.isStatusMenuOpen.set(false);
    this.pendingStatus.set(status);
  }

  cancelStatusRequest(): void {
    this.pendingStatus.set(null);
  }

  confirmStatusChange(): void {
    const newStatus = this.pendingStatus();
    if (!this.ticket || !newStatus || this.isChangingStatus()) return;

    this.isChangingStatus.set(true);

    this.ticketService.updateStatus(this.ticket.id, this.ticket.status, newStatus).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.pendingStatus.set(null);
        this.isChangingStatus.set(false);
        this.statusChanged.emit(updatedTicket);
      },
      error: (err: HttpErrorResponse) => {
        this.isChangingStatus.set(false);
        console.error('Erro ao alterar status do ticket:', err);
      },
    });
  }

  // ===== EDIÇÃO =====

  startEditing(): void {
    if (!this.ticket) return;

    this.editForm = new FormGroup({
      title: new FormControl(this.ticket.title, [Validators.required, Validators.maxLength(50)]),
      description: new FormControl(this.ticket.description, [Validators.required, Validators.maxLength(500)]),
      address: new FormGroup({
        street: new FormControl(this.ticket.address.street, [Validators.required]),
        number: new FormControl(this.ticket.address.number, [Validators.required]),
        neighborhood: new FormControl(this.ticket.address.neighborhood, [Validators.required]),
        city: new FormControl(this.ticket.address.city, [Validators.required]),
        state: new FormControl(this.ticket.address.state, [Validators.required, Validators.maxLength(2)]),
        zipCode: new FormControl(this.ticket.address.zipCode),
        complement: new FormControl(this.ticket.address.complement),
      }),
      priceMax: new FormControl(this.ticket.priceMax, [Validators.required]),
      paymentMethods: new FormControl(this.ticket.paymentMethods ?? [], [Validators.required]),
      availableDays: new FormControl(this.ticket.availableDays ?? [], [Validators.required]),
      availableHours: new FormControl(this.ticket.availableHours ?? [], [Validators.required]),
    });

    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  isEditFieldInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  isEditOptionSelected(field: string, value: any): boolean {
    return (this.editForm.get(field)?.value || []).includes(value);
  }

  toggleEditOption(field: string, value: any): void {
    const current = this.editForm.get(field)?.value || [];
    const updated = current.includes(value)
      ? current.filter((item: any) => item !== value)
      : [...current, value];

    this.editForm.get(field)?.setValue(updated);
    this.editForm.get(field)?.markAsTouched();
  }

  saveEdit(): void {
    if (!this.ticket) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const value = this.editForm.getRawValue();

    this.ticketService.update(this.ticket.id, value).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.ticketUpdated.emit(updatedTicket);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        console.error('Erro ao atualizar ticket:', err);
      },
    });
  }

  // ===== PROPOSTAS (PRESTADOR ENVIA) =====

  openProposalForm(): void {
    this.isProposalFormOpen.set(true);
  }

  cancelProposalForm(): void {
    this.isProposalFormOpen.set(false);
    this.proposalPriceControl.reset();
  }

  submitProposal(): void {
    if (!this.ticket || this.proposalPriceControl.invalid) {
      this.proposalPriceControl.markAsTouched();
      return;
    }

    this.isSubmittingProposal.set(true);

    this.proposalService.create({
      priceRange: this.proposalPriceControl.value!,
      ticketId: this.ticket.id,
    }).subscribe({
      next: (createdProposal) => {
        this.proposals.update(current => [...current, createdProposal]);
        this.bumpProposalsCount();
        this.isSubmittingProposal.set(false);
        this.isProposalFormOpen.set(false);
        this.proposalPriceControl.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmittingProposal.set(false);
        console.error('Erro ao enviar proposta:', err);
      },
    });
  }

  private bumpProposalsCount(): void {
    if (!this.ticket) return;
    const newCount = (this.ticket.proposalsCount ?? 0) + 1;

    this.ticketService.update(this.ticket.id, { proposalsCount: newCount }).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.ticketUpdated.emit(updatedTicket);
      },
      error: (err: HttpErrorResponse) => console.error('Erro ao atualizar contagem de propostas:', err),
    });
  }

  // ===== PROPOSTAS (CLIENTE VÊ E DECIDE) =====

  onAcceptProposal(proposal: Proposal): void {
    if (this.processingProposalId() !== null || !this.ticket) return;
    this.processingProposalId.set(proposal.id);

    this.proposalService.accept(proposal).subscribe({
      next: () => {
        this.ticketService.updateStatus(this.ticket!.id, this.ticket!.status, TicketStatus.IN_PROGRESS).subscribe({
          next: (updatedTicket) => {
            this.ticket = updatedTicket;
            this.ticketUpdated.emit(updatedTicket);
            this.rejectRemainingPending(proposal.id);
          },
          error: (err: HttpErrorResponse) => {
            this.processingProposalId.set(null);
            console.error('Erro ao atualizar status do ticket:', err);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.processingProposalId.set(null);
        console.error('Erro ao aceitar proposta:', err);
      },
    });
  }

  private rejectRemainingPending(acceptedProposalId: number): void {
    const others = this.proposals().filter(
      p => p.id !== acceptedProposalId && p.status === ProposalStatus.PENDING
    );

    if (others.length === 0) {
      this.processingProposalId.set(null);
      this.loadProposals(this.ticket!.id);
      return;
    }

    let remaining = others.length;
    others.forEach(p => {
      this.proposalService.reject(p).subscribe({
        next: () => {
          remaining--;
          if (remaining === 0) {
            this.processingProposalId.set(null);
            this.loadProposals(this.ticket!.id);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erro ao rejeitar proposta concorrente:', err);
          remaining--;
          if (remaining === 0) {
            this.processingProposalId.set(null);
            this.loadProposals(this.ticket!.id);
          }
        },
      });
    });
  }

  onRejectProposal(proposal: Proposal): void {
    if (this.processingProposalId() !== null || !this.ticket) return;
    this.processingProposalId.set(proposal.id);

    this.proposalService.reject(proposal).subscribe({
      next: () => {
        this.processingProposalId.set(null);
        this.loadProposals(this.ticket!.id);
      },
      error: (err: HttpErrorResponse) => {
        this.processingProposalId.set(null);
        console.error('Erro ao rejeitar proposta:', err);
      },
    });
  }

  getProposalStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada',
    };
    return labels[status] || status;
  }

  // ===== GERAIS =====

  closeModal(): void {
    this.isStatusMenuOpen.set(false);
    this.pendingStatus.set(null);
    this.isEditing.set(false);
    this.isProposalFormOpen.set(false);
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
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status || 'Desconhecido';
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

  formatList(list: string[] | undefined): string {
    if (!list || list.length === 0) return 'Não informado';
    return list.join(' • ');
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}