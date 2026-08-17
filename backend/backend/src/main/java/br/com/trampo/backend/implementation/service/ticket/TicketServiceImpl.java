package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketAvailableDayDto;
import br.com.trampo.backend.dto.ticket.TicketAvailableHourDto;
import br.com.trampo.backend.dto.ticket.TicketCreateResponseDto;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import br.com.trampo.backend.port.service.ticket.TicketService;
import br.com.trampo.backend.utils.TicketCodeGenerate;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.constructor.DuplicateKeyException;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketCodeGenerate ticketCodeGenerate;
    private final TicketDao ticketDao;
    private final AvailableDayDao availableDayDao;
    private final AvailableHourDao availableHourDao;
    private final CategoryService categoryService;

    public TicketServiceImpl(TicketCodeGenerate ticketCodeGenerate, TicketDao ticketDao, AvailableDayDao availableDayDao, AvailableHourDao availableHourDao, CategoryService categoryService) {
        this.ticketCodeGenerate = ticketCodeGenerate;
        this.ticketDao = ticketDao;
        this.availableDayDao = availableDayDao;
        this.availableHourDao = availableHourDao;
        this.categoryService = categoryService;
    }


    @Override
    public TicketCreateResponseDto createTicket(CreateTicketDto createTicketDto, Users user) {

        if (user == null || createTicketDto == null) {
            throw new IllegalArgumentException("Usuário e dados do ticket são obrigatórios.");
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
                return new TicketCreateResponseDto(
                        createTicketDto.title(),
                        createTicketDto.description()
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
}
