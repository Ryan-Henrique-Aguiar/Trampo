package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.*;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;
import br.com.trampo.backend.port.service.ticket.UrgentTicketService;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.SQLException;

@Service
public class UrgentTicketServiceImpl implements UrgentTicketService {

    private final AddressDao addressDao;
    private final UrgentTicketDao urgentTicketDao;
    private final Connection connection;

    public UrgentTicketServiceImpl(AddressDao addressDao, UrgentTicketDao urgentTicketDao, Connection connection) {
        this.addressDao = addressDao;
        this.urgentTicketDao = urgentTicketDao;
        this.connection = connection;
    }


    @Override
    public TicketDto createUrgentTicket(CreateTicketDto createTicketDto, Users user) throws SQLException {
        boolean originalAutoCommit = connection.getAutoCommit();

        if (user == null || createTicketDto == null) {
            throw new IllegalArgumentException("Usuário e dados do ticket são obrigatórios.");
        }

        int attempt = 0;
        int maxAttempt = 3;

        while (attempt < maxAttempt) {
            System.out.printf("'");
            attempt+=1;
            try{
                connection.setAutoCommit(false);

            }catch (SQLException e){
                throw e;
            }
            // 1. Tem que Obter uma única conexão do seu pool/dataSource
        }

        return null;
    }
}
