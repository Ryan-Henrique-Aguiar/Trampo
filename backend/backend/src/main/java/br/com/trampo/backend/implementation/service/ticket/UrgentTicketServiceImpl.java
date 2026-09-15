package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketStatusDto;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import br.com.trampo.backend.port.service.ticket.UrgentTicketService;
import br.com.trampo.backend.utils.TicketCodeGenerate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;

@Service
public class UrgentTicketServiceImpl implements UrgentTicketService {

    private final AddressDao addressDao;
    private final UrgentTicketDao urgentTicketDao;
    private final TicketCodeGenerate ticketCodeGenerate;
    private final CategoryService categoryService;
    private final TicketMapper ticketMapper;
    private final UsersDao usersDao;

    public UrgentTicketServiceImpl(AddressDao addressDao, UrgentTicketDao urgentTicketDao, TicketCodeGenerate ticketCodeGenerate, CategoryService categoryService, TicketMapper ticketMapper, UsersDao usersDao) {
        this.addressDao = addressDao;
        this.urgentTicketDao = urgentTicketDao;
        this.ticketCodeGenerate = ticketCodeGenerate;
        this.categoryService = categoryService;
        this.ticketMapper = ticketMapper;
        this.usersDao = usersDao;
    }

    @Transactional
    @Override
    public UrgentTicketDto createUrgentTicket(CreateUrgentTicketDto createUrgentTicketDto, Users user) throws SQLException {

        if (user == null || user.getId() == null || createUrgentTicketDto == null) {
            throw new InvalidRequestException("Usuário e dados do ticket são obrigatórios.");
        }

        if (createUrgentTicketDto.providerId() == null
                || createUrgentTicketDto.categoryId() == null
                || createUrgentTicketDto.addressDto() == null) {
            throw new InvalidRequestException("Prestador, categoria e endereço são obrigatórios.");
        }

        Users provider = usersDao.findProvidersAvailableForUrgency(
                        user.getId(),
                        createUrgentTicketDto.categoryId(),
                        createUrgentTicketDto.addressDto().state(),
                        createUrgentTicketDto.addressDto().city()
                )
                .stream()
                .filter(availableProvider -> availableProvider.getId().equals(createUrgentTicketDto.providerId()))
                .findFirst()
                .orElseThrow(() -> new InvalidRequestException("Prestador indisponível para esta urgência."));

        int attempt = 0;
        int maxAttempt = 3;

        while (attempt < maxAttempt) {

            try {
                String code = this.ticketCodeGenerate.generate();

                Address address = new Address(
                        createUrgentTicketDto.addressDto().street(),
                        createUrgentTicketDto.addressDto().number(),
                        createUrgentTicketDto.addressDto().neighborhood(),
                        createUrgentTicketDto.addressDto().city(),
                        createUrgentTicketDto.addressDto().state(),
                        createUrgentTicketDto.addressDto().zipCode(),
                        createUrgentTicketDto.addressDto().complement(),
                        user
                );
                Address savedAddressed = addressDao.save(address);
                UrgentTicket urgentTicket = new UrgentTicket(
                        code,
                        createUrgentTicketDto.title(),
                        createUrgentTicketDto.description(),
                        user,
                        provider,
                        savedAddressed,
                        categoryService.findCategoryById(createUrgentTicketDto.categoryId())
                );


                UrgentTicket newUrgentTicket = urgentTicketDao.save(urgentTicket);

                usersDao.incrementCreatedServicesCount(user.getId());

                return ticketMapper.toUrgentTicket(newUrgentTicket);

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
                        throw new DatabaseException("Não foi possível gerar um código único.", e);
                    }
                } else {
                    throw new RuntimeException("Erro ao salvar ticket Urgente no banco de dados.", e);
                }
            }
        }
        throw new RuntimeException("Falha inesperada ao criar ticket Urgente.");
    }

    @Override
    public PageDto<UrgentTicketDto> getMyUrgentTickets(Users user, List<StatusTicket> statuses, int page, int size) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado ou inválido.");
        }
        try {
            if (page < 0 || size < 1 || size > 50) {
                throw new InvalidRequestException("Paginação inválida.");
            }
            List<UrgentTicket> tickets = urgentTicketDao.findByUserId(user.getId(), statuses, page, size);
            boolean hasNext = tickets.size() > size;
            if (hasNext) tickets = tickets.subList(0, size);
            return new PageDto<>(tickets.stream().map(ticketMapper::toUrgentTicket).toList(), hasNext);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao consultar tickets urgentes do usuário.", e);
        }
    }

    @Override
    public PageDto<UrgentTicketDto> getMyProvidedUrgentTickets(Users user, List<StatusTicket> statuses, int page, int size) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado ou inválido.");
        }
        if (!user.isProvider()) {
            throw new UnauthorizedUserException("Apenas prestadores podem consultar seus serviços urgentes.");
        }
        if (page < 0 || size < 1 || size > 50) {
            throw new InvalidRequestException("Paginação inválida.");
        }

        try {
            List<UrgentTicket> tickets = urgentTicketDao.findByProviderId(user.getId(), statuses, page, size);
            boolean hasNext = tickets.size() > size;
            if (hasNext) tickets = tickets.subList(0, size);
            return new PageDto<>(tickets.stream().map(ticketMapper::toUrgentTicket).toList(), hasNext);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao consultar tickets urgentes do prestador.", e);
        }
    }

    @Transactional
    @Override
    public UrgentTicketDto updateStatus(int ticketId, UpdateTicketStatusDto data, Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        if (ticketId <= 0 || data == null || data.status() == null) {
            throw new InvalidRequestException("Ticket e status são obrigatórios.");
        }

        UrgentTicket ticket = urgentTicketDao.findById(ticketId)
                .orElseThrow(() -> new InvalidRequestException("Ticket urgente não encontrado."));
        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedUserException("Apenas o criador do ticket pode alterar o status.");
        }
        StatusTicket newStatus;
        try {
            newStatus = StatusTicket.valueOf(data.status().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Status do ticket urgente inválido.");
        }
        if (ticket.getStatus() == StatusTicket.OPEN) {
            if (newStatus != StatusTicket.IN_PROGRESS && newStatus != StatusTicket.CANCELLED) {
                throw new InvalidRequestException("O ticket urgente aberto só pode ser iniciado ou cancelado.");
            }
        } else if (ticket.getStatus() == StatusTicket.IN_PROGRESS) {
            if (newStatus != StatusTicket.COMPLETED && newStatus != StatusTicket.CANCELLED) {
                throw new InvalidRequestException("O ticket urgente em andamento só pode ser concluído ou cancelado.");
            }
        } else {
            throw new InvalidRequestException("O status deste ticket urgente não pode mais ser alterado.");
        }

        if (!urgentTicketDao.updateStatus(ticketId, ticket.getStatus(), newStatus)) {
            throw new InvalidRequestException("O status deste ticket urgente já foi alterado.");
        }
        return ticketMapper.toUrgentTicket(urgentTicketDao.findById(ticketId)
                .orElseThrow(() -> new InvalidRequestException("Ticket urgente não encontrado.")));
    }

}
