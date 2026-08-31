package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.dto.ticket.*;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
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
import java.util.List;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketCodeGenerate ticketCodeGenerate;
    private final TicketDao ticketDao;
    private final AvailableDayDao availableDayDao;
    private final AvailableHourDao availableHourDao;
    private final CategoryService categoryService;
    private final TicketMapper ticketMapper;
    private final TicketPaymentMethodDao ticketPaymentMethodDao;

    public TicketServiceImpl(TicketCodeGenerate ticketCodeGenerate, TicketDao ticketDao, AvailableDayDao availableDayDao, AvailableHourDao availableHourDao, CategoryService categoryService, TicketMapper ticketMapper, TicketPaymentMethodDao ticketPaymentMethodDao) {
        this.ticketCodeGenerate = ticketCodeGenerate;
        this.ticketDao = ticketDao;
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
}
