import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { DecimalPipe } from '@angular/common';

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
import { ReviewService } from '../../../services/review/review-service';
import { Review } from '../../../models/review.model';

@Component({
  selector: 'app-ticket-detail',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css'
})
export class TicketDetail implements OnInit {

  @Input() ticket: Ticket | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<Ticket>();

  readonly paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  readonly dayOptions = [
    { label: 'Segunda', value: WeekDay.MONDAY },
    { label: 'Terça', value: WeekDay.TUESDAY },
    { label: 'Quarta', value: WeekDay.WEDNESDAY },
    { label: 'Quinta', value: WeekDay.THURSDAY },
    { label: 'Sexta', value: WeekDay.FRIDAY },
    { label: 'Sábado', value: WeekDay.SATURDAY },
    { label: 'Domingo', value: WeekDay.SUNDAY },
  ];

  readonly hourOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
    '00:00'
  ];

  isStatusMenuOpen = false;
  pendingStatus: TicketStatus | null = null;
  isChangingStatus = false;

  isEditing = false;
  isSaving = false;
  editForm!: FormGroup;

  proposals: Proposal[] = [];
  loadingProposals = false;
  proposalsError: string | null = null;
  isProposalFormOpen = false;
  isSubmittingProposal = false;

  canReview = false;
  alreadyReviewed = false;
  isSubmittingReview = false;
  isReviewsOpen = false;
  loadingReviews = false;
  reviews: Review[] = [];
  reviewScoreControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
    Validators.max(5)
  ]);
  reviewCommentControl = new FormControl('', [Validators.maxLength(500)]);

  proposalPriceControl = new FormControl<number | null>(
    null,
    [Validators.required]
  );

  constructor(
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private ticketService: TicketService,
    private proposalService: ProposalService,
    private reviewService: ReviewService,
    private toastrService: ToastrService,
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
      .getAvailableStatusTransitions(this.ticket.status);
  }

  get isPendingStatusIrreversible(): boolean {
    return this.pendingStatus === TicketStatus.COMPLETED ||
      this.pendingStatus === TicketStatus.CANCELLED;
  }

  get myProposal(): Proposal | null {
    if (!this.isProviderMode) return null;

    return this.proposals[0] ?? null;
  }

  get acceptedProposal(): Proposal | null {
    return this.proposals.find(
      proposal => proposal.status === ProposalStatus.ACCEPTED
    ) ?? null;
  }

  get reviewedUserId(): number | null {
    if (!this.ticket) return null;
    return this.isProviderMode
      ? this.ticket.userId
      : this.acceptedProposal?.professionalId ?? null;
  }

  get reviewedUserName(): string {
    if (!this.ticket) return '';
    return this.isProviderMode
      ? this.ticket.userName
      : this.acceptedProposal?.professionalName ?? '';
  }

  get reviewedUserRating(): number | null {
    if (!this.ticket) return null;
    return this.isProviderMode
      ? this.ticket.userRating
      : this.acceptedProposal?.professionalRating ?? null;
  }

  get shouldShowReviewedUser(): boolean {
    return this.isProviderMode || this.acceptedProposal !== null;
  }

  get canSendProposal(): boolean {
    return this.isProviderMode &&
      !this.loadingProposals &&
      !this.proposalsError &&
      this.ticket?.status === TicketStatus.OPEN &&
      this.myProposal === null;
  }

  ngOnInit(): void {
    if (!this.ticket) return;

    this.proposalPriceControl.setValidators([
      Validators.required,
      Validators.min(0.01),
      ...(this.ticket.priceMax != null
        ? [Validators.max(this.ticket.priceMax)]
        : [])
    ]);
    this.proposalPriceControl.updateValueAndValidity();

    if (this.isProviderMode || (this.ticket.proposalsCount ?? 0) > 0) {
      this.loadProposals(this.ticket.id);
    }
  }

  private async loadProposals(ticketId: number): Promise<void> {
    this.loadingProposals = true;
    this.proposalsError = null;

    try {
      this.proposals = await this.proposalService.getByTicketId(ticketId);
      if (this.canCurrentUserReview()) {
        await this.loadReviewStatus();
      }
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);
      this.proposals = [];
      this.proposalsError = 'Não foi possível carregar sua proposta.';
    } finally {
      this.loadingProposals = false;
      this.cdr.detectChanges();
    }
  }

  private canCurrentUserReview(): boolean {
    if (this.ticket?.status !== TicketStatus.COMPLETED) return false;
    if (this.isOwnTicket) return this.acceptedProposal !== null;
    return this.myProposal?.status === ProposalStatus.ACCEPTED;
  }

  private async loadReviewStatus(): Promise<void> {
    if (!this.ticket) return;

    try {
      const status = await this.reviewService.getStatus(this.ticket.id);
      this.canReview = status.canReview;
      this.alreadyReviewed = status.alreadyReviewed;
    } catch (err) {
      console.error('Erro ao consultar avaliação:', err);
    }
  }

  async submitReview(): Promise<void> {
    if (!this.ticket || !this.canReview || this.isSubmittingReview) return;

    if (this.reviewScoreControl.invalid) {
      this.reviewScoreControl.markAsTouched();
      return;
    }

    this.isSubmittingReview = true;
    try {
      await this.reviewService.create(
        this.ticket.id,
        this.reviewScoreControl.value!,
        this.reviewCommentControl.value ?? ''
      );
      if (this.reviewedUserId) {
        this.reviews = await this.reviewService.getByUserId(this.reviewedUserId);
        this.updateDisplayedRating();
      }
      this.canReview = false;
      this.alreadyReviewed = true;
      this.reviewScoreControl.reset();
      this.reviewCommentControl.reset();
      this.toastrService.success('Avaliação enviada com sucesso');
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      this.toastrService.error('Não foi possível enviar a avaliação');
    } finally {
      this.isSubmittingReview = false;
      this.cdr.detectChanges();
    }
  }

  private updateDisplayedRating(): void {
    if (this.reviews.length === 0 || !this.ticket) return;

    const rating = this.reviews.reduce(
      (total, review) => total + review.score,
      0
    ) / this.reviews.length;

    if (this.isProviderMode) {
      this.ticket.userRating = rating;
    } else if (this.acceptedProposal) {
      this.acceptedProposal.professionalRating = rating;
    }
  }

  async openReviewsModal(): Promise<void> {
    this.isReviewsOpen = true;
    if (this.reviews.length > 0 || !this.reviewedUserId) return;

    this.loadingReviews = true;
    try {
      this.reviews = await this.reviewService.getByUserId(this.reviewedUserId);
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err);
      this.toastrService.error('Não foi possível carregar as avaliações');
    } finally {
      this.loadingReviews = false;
      this.cdr.detectChanges();
    }
  }

  closeReviewsModal(): void {
    this.isReviewsOpen = false;
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

      this.ticketUpdated.emit(updatedTicket);
      if (this.canCurrentUserReview()) {
        await this.loadReviewStatus();
      }
      this.toastrService.success('Status atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao alterar status do ticket:', err);
      this.toastrService.error('Não foi possível atualizar o status');
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
        [Validators.required, Validators.min(0.01)]
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
      this.toastrService.success('Serviço atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar ticket:', err);
      this.toastrService.error('Não foi possível atualizar o serviço');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openProposalForm(): void {
    if (!this.canSendProposal) return;

    this.isProposalFormOpen = true;
  }

  cancelProposalForm(): void {
    this.isProposalFormOpen = false;
    this.proposalPriceControl.reset();
  }

  async submitProposal(): Promise<void> {
    if (!this.canSendProposal || !this.ticket) return;

    if (this.proposalPriceControl.invalid) {
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

      this.isProposalFormOpen = false;
      this.proposalPriceControl.reset();
      this.toastrService.success('Proposta enviada com sucesso');
      this.ticketUpdated.emit(this.ticket);
      this.closeModal();
    } catch (err) {
      console.error('Erro ao enviar proposta:', err);
      this.toastrService.error('Não foi possível enviar a proposta');
    } finally {
      this.isSubmittingProposal = false;
      this.cdr.detectChanges();
    }
  }

  getProposalStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada',
    };

    return labels[status];
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };

    return labels[status];
  }

  getStatusClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'status-open',
      [TicketStatus.IN_PROGRESS]: 'status-progress',
      [TicketStatus.COMPLETED]: 'status-completed',
      [TicketStatus.CANCELLED]: 'status-cancelled'
    };

    return classes[status];
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
