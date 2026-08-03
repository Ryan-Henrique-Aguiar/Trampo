package br.com.trampo.backend.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Ticket;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.TicketDao;
import br.com.trampo.backend.port.dao.UsersDao;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class TicketDaoTest {

    @Autowired
    private Connection connection;

    @Autowired
    private UsersDao usersDao;

    @Autowired
    private AddressDao addressDao;

    @Autowired
    private CategoryDao categoryDao;

    @Autowired
    private TicketDao ticketDao;

    private Integer ticketIdSalvo;
    private Integer categoryIdSalva;
    private Integer userIdSalvo;
    private Integer addressIdSalvo;

    @AfterEach
    void tearDown() throws Exception {

        try (Statement stmt = connection.createStatement()) {

            // Ticket
            if (ticketIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM ticket WHERE id = " + ticketIdSalvo);
            }

            // Categoria
            if (categoryIdSalva != null) {
                stmt.executeUpdate("DELETE FROM category WHERE id = " + categoryIdSalva);
            }

            // Usuário
            if (userIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM users WHERE id = " + userIdSalvo);
            }

            // Endereço
            if (addressIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM address WHERE id = " + addressIdSalvo);
            }
        }

        System.out.println("🧹 Dados removidos com sucesso.");
    }

    @Test
    @DisplayName("Deve salvar um Ticket com sucesso")
    void deveSalvarTicketComSucesso() throws SQLException {

        long timestamp = System.currentTimeMillis();

        //-----------------------------
        // ENDEREÇO
        //-----------------------------
        Address address = new Address();

        address.setStreet("Avenida Paulista");
        address.setNumber("1000");
        address.setNeighborhood("Bela Vista");
        address.setCity("São Paulo");
        address.setState("SP");
        address.setZipCode("01310100");
        address.setComplement("Apartamento 101");

        Address addressSalvo = addressDao.save(address);

        assertNotNull(addressSalvo.getId());

        addressIdSalvo = addressSalvo.getId();

        //-----------------------------
        // USUÁRIO
        //-----------------------------
        Users user = new Users();

        user.setName("Maria Oliveira");
        user.setEmail("maria" + timestamp + "@email.com");
        user.setPassword("123456");
        user.setCpf(String.valueOf(timestamp).substring(0, 11));

        user.setPhone("35999999999");
        user.setNickname("Maria");

        user.setProvider(false);

        user.setAvailableForUrgency(false);

        user.setCreatedServicesCount(0);

        user.setCompletedServicesCount(0);

        user.setCity("São Paulo");
        user.setState("SP");

        Users userSalvo = usersDao.save(user);

        assertNotNull(userSalvo.getId());

        userIdSalvo = userSalvo.getId();

        //-----------------------------
        // CATEGORIA
        //-----------------------------
        Category category = new Category();

        category.setName("Elétrica");
        category.setIconUrl("assets/icons/eletrica.svg");

        Category categorySalva = categoryDao.save(category);

        assertNotNull(categorySalva.getId());

        categoryIdSalva = categorySalva.getId();

        //-----------------------------
        // TICKET
        //-----------------------------
        Ticket ticket = new Ticket();

        ticket.setCode("TRP-" + timestamp);

        ticket.setTitle("Troca de Disjuntor");

        ticket.setDescription("Disjuntor principal está desarmando constantemente.");

        ticket.setPriceMax(BigDecimal.valueOf(500));

        ticket.setCreatedAt(LocalDateTime.now());

        ticket.setStatus(StatusTicket.OPEN);

        ticket.setProposalsCount(0);

        ticket.setClient(userSalvo);

        ticket.setAddress(addressSalvo);

        ticket.setCategory(categorySalva);

        Ticket ticketSalvo = ticketDao.save(ticket);

        assertNotNull(ticketSalvo.getId());

        ticketIdSalvo = ticketSalvo.getId();

        System.out.println("✅ Ticket salvo com ID: " + ticketSalvo.getId());
    }
}