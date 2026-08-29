package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import br.com.trampo.backend.port.service.ticket.UrgentTicketService;
import br.com.trampo.backend.utils.TicketCodeGenerate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;

@Service
public class UrgentTicketServiceImpl implements UrgentTicketService {

    private final AddressDao addressDao;
    private final UrgentTicketDao urgentTicketDao;
    private final TicketCodeGenerate ticketCodeGenerate;
    private final CategoryService categoryService;
    private final TicketMapper ticketMapper;

    public UrgentTicketServiceImpl(AddressDao addressDao, UrgentTicketDao urgentTicketDao, TicketCodeGenerate ticketCodeGenerate, CategoryService categoryService, TicketMapper ticketMapper) {
        this.addressDao = addressDao;
        this.urgentTicketDao = urgentTicketDao;
        this.ticketCodeGenerate = ticketCodeGenerate;
        this.categoryService = categoryService;
        this.ticketMapper = ticketMapper;
    }

    @Transactional
    @Override
    public UrgentTicketDto createUrgentTicket(CreateUrgentTicketDto createUrgentTicketDto, Users user) throws SQLException {

        if (user == null || createUrgentTicketDto == null) {
            throw new InvalidRequestException("Usuário e dados do ticket são obrigatórios.");
        }


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
                        savedAddressed,
                        categoryService.findCategoryById(createUrgentTicketDto.categoryId())
                );


                UrgentTicket newUrgentTicket = urgentTicketDao.save(urgentTicket);

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
}
