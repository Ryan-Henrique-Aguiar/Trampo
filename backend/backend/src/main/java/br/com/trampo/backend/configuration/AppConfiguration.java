package br.com.trampo.backend.configuration;

import br.com.trampo.backend.implementation.dao.AddressPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.CategoryPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.UsersCategoryPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.proposal.ProposalPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.ticket.AvailableDayDaoImpl;
import br.com.trampo.backend.implementation.dao.ticket.AvailableHourDaoImpl;
import br.com.trampo.backend.implementation.dao.ticket.TicketPaymentMethodDaoImpl;
import br.com.trampo.backend.implementation.dao.users.UsersPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.ticket.TicketPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.ticket.UrgentTicketPostgresDaoImpl;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.proposal.ProposalDao;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class AppConfiguration {

    @Bean
    public UsersDao usersDao(DataSource dataSource) {
        return new UsersPostgresDaoImpl(dataSource);
    }

    // Renomeado de getMedicDao para addressDao para refletir a entidade correta
    @Bean
    public AddressDao addressDao(DataSource dataSource) {
        return new AddressPostgresDaoImpl(dataSource);
    }

    // Renomeado de getPatientDao para ticketDao
    @Bean
    public TicketDao ticketDao(DataSource dataSource, AddressDao addressDao) {
        return new TicketPostgresDaoImpl(dataSource, addressDao);
    }

    // Novo Bean para o UrgentTicketDao
    @Bean
    public UrgentTicketDao urgentTicketDao(DataSource dataSource) {
        return new UrgentTicketPostgresDaoImpl(dataSource);
    }

    @Bean
    public CategoryDao categoryDao(DataSource dataSource) {
        return new CategoryPostgresDaoImpl(dataSource);
    }

    @Bean
    public UsersCategoryDao usersCategoryDao(DataSource dataSource) {
        return new UsersCategoryPostgresDaoImpl(dataSource);
    }

    @Bean
    public AvailableDayDao availableDayDao(DataSource dataSource) {
        return new AvailableDayDaoImpl(dataSource);
    }

    @Bean
    public AvailableHourDao availableHourDao(DataSource dataSource) {
        return new AvailableHourDaoImpl(dataSource);
    }

    @Bean
    public TicketPaymentMethodDao ticketPaymentMethodDao(DataSource dataSource) {
        return new TicketPaymentMethodDaoImpl(dataSource);
    }

    @Bean
    public ProposalDao proposalDao(DataSource dataSource) {
        return new ProposalPostgresDaoImpl(dataSource);
    }
}
