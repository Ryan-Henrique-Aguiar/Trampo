package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.dto.ticket.*;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import br.com.trampo.backend.port.service.ticket.TicketService;
import br.com.trampo.backend.utils.TicketCodeGenerate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yaml.snakeyaml.constructor.DuplicateKeyException;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
public class TicketServiceImpl implements TicketService {

    private static final Set<String> AVAILABLE_DAYS = Set.of(
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY"
    );

    private final TicketCodeGenerate ticketCodeGenerate;
    private final TicketDao ticketDao;
    private final AddressDao addressDao;
    private final AvailableDayDao availableDayDao;
    private final AvailableHourDao availableHourDao;
    private final CategoryService categoryService;
    private final TicketMapper ticketMapper;
    private final TicketPaymentMethodDao ticketPaymentMethodDao;

    public TicketServiceImpl(TicketCodeGenerate ticketCodeGenerate, TicketDao ticketDao, AddressDao addressDao, AvailableDayDao availableDayDao, AvailableHourDao availableHourDao, CategoryService categoryService, TicketMapper ticketMapper, TicketPaymentMethodDao ticketPaymentMethodDao) {
        this.ticketCodeGenerate = ticketCodeGenerate;
        this.ticketDao = ticketDao;
        this.addressDao = addressDao;
        this.availableDayDao = availableDayDao;
        this.availableHourDao = availableHourDao;
        this.categoryService = categoryService;
        this.ticketMapper = ticketMapper;
        this.ticketPaymentMethodDao = ticketPaymentMethodDao;
    }

    @Transactional
    @Override
    public TicketDto createTicket(CreateTicketDto createTicketDto, Users user) {

        if (user == null || createTicketDto == null) {
            throw new InvalidRequestException("Usuário e dados do ticket são obrigatórios.");
        }

        if (createTicketDto.priceMax() == null
                || createTicketDto.priceMax().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("O orçamento máximo deve ser maior que zero.");
        }


        int attempt = 0;
        int maxAttempt = 3;

        while (attempt < maxAttempt) {

            try {
                String ticketCode = this.ticketCodeGenerate.generate();

                Address address = new Address(
                        createTicketDto.addressDto().street(),
                        createTicketDto.addressDto().number(),
                        createTicketDto.addressDto().neighborhood(),
                        createTicketDto.addressDto().city(),
                        createTicketDto.addressDto().state(),
                        createTicketDto.addressDto().zipCode(),
                        createTicketDto.addressDto().complement(),
                        user
                );

                Ticket ticket = new Ticket(
                        ticketCode,
                        createTicketDto.title(),
                        createTicketDto.description(),
                        createTicketDto.priceMax(),
                        user,
                        address,
                        categoryService.findCategoryById(createTicketDto.categoryId())
                );
                Ticket newTicket = ticketDao.save(ticket);
                for (TicketAvailableDayDto availableDayDto : createTicketDto.availableDays()) {
                    AvailableDay availableDay = new AvailableDay(
                            availableDayDto.availableDay(),
                            newTicket
                    );
                    availableDayDao.save(availableDay);
                }
                for (TicketAvailableHourDto availableHourDto : createTicketDto.availableHours()) {
                    AvailableHour availableHour = new AvailableHour(
                            availableHourDto.availableHour(),
                            newTicket
                    );
                    availableHourDao.save(availableHour);
                }

                for (var paymentMethod : createTicketDto.paymentMethods()) {
                    TicketPaymentMethod ticketPaymentMethod = new TicketPaymentMethod(
                            paymentMethod,
                            newTicket
                    );
                    ticketPaymentMethodDao.save(ticketPaymentMethod);
                }

                return ticketMapper.toDto(
                        newTicket,
                        createTicketDto.paymentMethods(),
                        createTicketDto.availableDays().stream()
                                .map(TicketAvailableDayDto::availableDay)
                                .toList(),
                        createTicketDto.availableHours().stream()
                                .map(TicketAvailableHourDto::availableHour)
                                .toList()
                );

            } catch (DuplicateKeyException e) {
                attempt++;
                if (attempt >= maxAttempt) {
                    throw new RuntimeException("Não foi possível gerar um código único após " + maxAttempt + " tentativas.", e);
                }
            } catch (SQLException e) {
                // Se estiver usando JDBC puro e a exceção de chave duplicada for do Postgres (SQLState 23505)
                if ("23505".equals(e.getSQLState())) {
                    attempt++;
                    if (attempt >= maxAttempt) {
                        throw new RuntimeException("Não foi possível gerar um código único.", e);
                    }
                } else {
                    throw new RuntimeException("Erro ao salvar ticket no banco de dados.", e);
                }
            }
        }
        throw new RuntimeException("Falha inesperada ao criar ticket.");

    }


    @Override
    public List<TicketDto> getMyTickets(Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado ou inválido.");
        }

        try {
            List<Ticket> tickets = ticketDao.findByUserId(user.getId());

            return tickets.stream().map(ticket -> {
                try {
                    List<PaymentMethod> paymentMethods = ticketPaymentMethodDao.findByTicketId(ticket.getId());
                    List<String> availableDays = availableDayDao.findByTicketId(ticket.getId());
                    List<String> availableHours = availableHourDao.findByTicketId(ticket.getId());

                    return ticketMapper.toDto(ticket, paymentMethods, availableDays, availableHours);
                } catch (SQLException e) {
                    throw new DatabaseException("Erro ao carregar os detalhes do ticket ID: " + ticket.getId(), e);
                }
            }).toList();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao consultar tickets do usuário no banco de dados.", e);
        }
    }

    @Override
    public List<TicketDto> getAvailableTickets(Users user, Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice
    ) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Usuário autenticado é obrigatório");
        }

        if (!user.isProvider()) {
            throw new IllegalArgumentException("Apenas prestadores podem consultar tickets disponíveis");
        }

        try {
            return ticketDao.findAvailableForProvider(
                            user.getId(),
                            user.getCity(),
                            user.getState(),
                            categoryId,
                            minPrice,
                            maxPrice
                    )
                    .stream()
                    .map(ticketMapper::toDto)
                    .toList();

        } catch (SQLException exception) {
            throw new RuntimeException("Erro ao consultar tickets disponíveis", exception);
        }
    }

    @Transactional
    @Override
    public TicketDto updateTicket(int ticketId, UpdateTicketDto updateTicketDto, Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário autenticado é obrigatório.");
        }

        if (ticketId <= 0 || updateTicketDto == null) {
            throw new InvalidRequestException("Ticket e dados da atualização são obrigatórios.");
        }

        Ticket ticket = findTicketById(ticketId);

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedUserException("Apenas o criador do ticket pode editá-lo.");
        }

        if (ticket.getStatus() != StatusTicket.OPEN) {
            throw new InvalidRequestException("Apenas tickets abertos podem ser editados.");
        }

        validateUpdateTicket(updateTicketDto);

        Address address = ticket.getAddress();
        address.setStreet(updateTicketDto.addressDto().street().trim());
        address.setNumber(updateTicketDto.addressDto().number().trim());
        address.setNeighborhood(updateTicketDto.addressDto().neighborhood().trim());
        address.setCity(updateTicketDto.addressDto().city().trim());
        address.setState(updateTicketDto.addressDto().state().trim().toUpperCase(Locale.ROOT));
        address.setZipCode(updateTicketDto.addressDto().zipCode().trim());
        address.setComplement(updateTicketDto.addressDto().complement());

        ticket.setTitle(updateTicketDto.title().trim());
        ticket.setDescription(updateTicketDto.description().trim());
        ticket.setPriceMax(updateTicketDto.priceMax());

        try {
            addressDao.update(address);
            ticketDao.update(ticket);

            availableDayDao.deleteByTicketId(ticketId);
            availableHourDao.deleteByTicketId(ticketId);
            ticketPaymentMethodDao.deleteByTicketId(ticketId);

            for (TicketAvailableDayDto availableDayDto : updateTicketDto.availableDays()) {
                availableDayDao.save(new AvailableDay(availableDayDto.availableDay(), ticket));
            }

            for (TicketAvailableHourDto availableHourDto : updateTicketDto.availableHours()) {
                availableHourDao.save(new AvailableHour(availableHourDto.availableHour(), ticket));
            }

            for (PaymentMethod paymentMethod : updateTicketDto.paymentMethods()) {
                ticketPaymentMethodDao.save(new TicketPaymentMethod(paymentMethod, ticket));
            }

            return ticketMapper.toDto(
                    ticket,
                    updateTicketDto.paymentMethods(),
                    updateTicketDto.availableDays().stream()
                            .map(TicketAvailableDayDto::availableDay)
                            .toList(),
                    updateTicketDto.availableHours().stream()
                            .map(TicketAvailableHourDto::availableHour)
                            .toList()
            );
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar ticket no banco de dados.", e);
        }
    }

    @Transactional
    @Override
    public TicketDto updateStatus(int ticketId, UpdateTicketStatusDto updateTicketStatusDto, Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário autenticado é obrigatório.");
        }

        if (ticketId <= 0 || updateTicketStatusDto == null
                || updateTicketStatusDto.status() == null
                || updateTicketStatusDto.status().isBlank()) {
            throw new InvalidRequestException("Ticket e status são obrigatórios.");
        }

        Ticket ticket = findTicketById(ticketId);

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedUserException("Apenas o criador do ticket pode alterar o status.");
        }

        StatusTicket newStatus = parseStatus(updateTicketStatusDto.status());
        validateStatusTransition(ticket.getStatus(), newStatus);

        ticketDao.updateStatus(ticketId, newStatus);

        Ticket updatedTicket = findTicketById(ticketId);

        try {
            List<PaymentMethod> paymentMethods = ticketPaymentMethodDao.findByTicketId(ticketId);
            List<String> availableDays = availableDayDao.findByTicketId(ticketId);
            List<String> availableHours = availableHourDao.findByTicketId(ticketId);

            return ticketMapper.toDto(updatedTicket, paymentMethods, availableDays, availableHours);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao carregar os detalhes do ticket atualizado.", e);
        }
    }

    private Ticket findTicketById(int ticketId) {
        try {
            return ticketDao.findById(ticketId)
                    .orElseThrow(() -> new InvalidRequestException("Ticket não encontrado."));
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar ticket por ID.", e);
        }
    }

    private StatusTicket parseStatus(String status) {
        try {
            return StatusTicket.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Status do ticket inválido.");
        }
    }

    private void validateStatusTransition(StatusTicket currentStatus, StatusTicket newStatus) {
        boolean allowed = switch (currentStatus) {
            case OPEN -> newStatus == StatusTicket.CANCELLED;
            case IN_PROGRESS -> newStatus == StatusTicket.COMPLETED
                    || newStatus == StatusTicket.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new InvalidRequestException(
                    "Não é permitido alterar o status de " + currentStatus + " para " + newStatus + "."
            );
        }
    }

    private void validateUpdateTicket(UpdateTicketDto updateTicketDto) {
        if (isBlank(updateTicketDto.title()) || updateTicketDto.title().trim().length() > 50) {
            throw new InvalidRequestException("O título é obrigatório e deve ter no máximo 50 caracteres.");
        }

        if (isBlank(updateTicketDto.description()) || updateTicketDto.description().trim().length() > 500) {
            throw new InvalidRequestException("A descrição é obrigatória e deve ter no máximo 500 caracteres.");
        }

        if (updateTicketDto.priceMax() == null
                || updateTicketDto.priceMax().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("O orçamento máximo deve ser maior que zero.");
        }

        validateAddress(updateTicketDto);
        validatePaymentMethods(updateTicketDto);
        validateAvailableDays(updateTicketDto);
        validateAvailableHours(updateTicketDto);
    }

    private void validateAddress(UpdateTicketDto updateTicketDto) {
        if (updateTicketDto.addressDto() == null
                || isBlank(updateTicketDto.addressDto().street())
                || isBlank(updateTicketDto.addressDto().number())
                || isBlank(updateTicketDto.addressDto().neighborhood())
                || isBlank(updateTicketDto.addressDto().city())
                || isBlank(updateTicketDto.addressDto().state())
                || updateTicketDto.addressDto().zipCode() == null) {
            throw new InvalidRequestException("Os dados obrigatórios do endereço devem ser informados.");
        }

        if (updateTicketDto.addressDto().street().trim().length() > 150
                || updateTicketDto.addressDto().number().trim().length() > 20
                || updateTicketDto.addressDto().neighborhood().trim().length() > 100
                || updateTicketDto.addressDto().city().trim().length() > 100
                || updateTicketDto.addressDto().state().trim().length() != 2
                || updateTicketDto.addressDto().zipCode().trim().length() > 10
                || updateTicketDto.addressDto().complement() != null
                && updateTicketDto.addressDto().complement().length() > 100) {
            throw new InvalidRequestException("Um ou mais dados do endereço possuem tamanho inválido.");
        }
    }

    private void validatePaymentMethods(UpdateTicketDto updateTicketDto) {
        if (updateTicketDto.paymentMethods() == null || updateTicketDto.paymentMethods().isEmpty()) {
            throw new InvalidRequestException("Selecione pelo menos uma forma de pagamento.");
        }

        if (updateTicketDto.paymentMethods().stream().anyMatch(Objects::isNull)
                || new HashSet<>(updateTicketDto.paymentMethods()).size()
                != updateTicketDto.paymentMethods().size()) {
            throw new InvalidRequestException("As formas de pagamento não podem ser repetidas.");
        }
    }

    private void validateAvailableDays(UpdateTicketDto updateTicketDto) {
        if (updateTicketDto.availableDays() == null || updateTicketDto.availableDays().isEmpty()) {
            throw new InvalidRequestException("Selecione pelo menos um dia disponível.");
        }

        if (updateTicketDto.availableDays().stream().anyMatch(Objects::isNull)) {
            throw new InvalidRequestException("Os dias disponíveis informados são inválidos.");
        }

        List<String> days = updateTicketDto.availableDays().stream()
                .map(TicketAvailableDayDto::availableDay)
                .toList();

        if (days.stream().anyMatch(day -> day == null || !AVAILABLE_DAYS.contains(day))
                || new HashSet<>(days).size() != days.size()) {
            throw new InvalidRequestException("Os dias disponíveis informados são inválidos.");
        }
    }

    private void validateAvailableHours(UpdateTicketDto updateTicketDto) {
        if (updateTicketDto.availableHours() == null || updateTicketDto.availableHours().isEmpty()) {
            throw new InvalidRequestException("Selecione pelo menos um horário disponível.");
        }

        if (updateTicketDto.availableHours().stream().anyMatch(Objects::isNull)) {
            throw new InvalidRequestException("Os horários disponíveis informados são inválidos.");
        }

        List<String> hours = updateTicketDto.availableHours().stream()
                .map(TicketAvailableHourDto::availableHour)
                .toList();

        if (new HashSet<>(hours).size() != hours.size()) {
            throw new InvalidRequestException("Os horários disponíveis não podem ser repetidos.");
        }

        for (String hour : hours) {
            try {
                LocalTime parsedHour = LocalTime.parse(hour);
                boolean validHour = parsedHour.getMinute() == 0
                        && parsedHour.getSecond() == 0
                        && (parsedHour.getHour() == 0 || parsedHour.getHour() >= 6);

                if (!validHour) {
                    throw new InvalidRequestException("Os horários disponíveis informados são inválidos.");
                }
            } catch (DateTimeException | NullPointerException e) {
                throw new InvalidRequestException("Os horários disponíveis informados são inválidos.");
            }
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
