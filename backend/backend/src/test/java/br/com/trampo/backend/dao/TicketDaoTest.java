package br.com.trampo.backend.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Ticket;
import br.com.trampo.backend.domain.user.Client;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.ClientDao;
import br.com.trampo.backend.port.dao.TicketDao;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class TicketDaoTest {

    @Autowired
    private Connection connection; // Injeta a conexão com o PostgreSQL

    @Autowired
    private ClientDao clientDao;

    @Autowired
    private AddressDao addressDao;

    @Autowired
    private CategoryDao categoryDao;

    @Autowired
    private TicketDao ticketDao;

    // Guarda os IDs para apagar exatamente o que foi inserido neste teste
    private Integer ticketIdSalvo;
    private Integer categoryIdSalva;
    private Integer clientIdSalvo;
    private Integer addressIdSalvo;

    @AfterEach
    void tearDown() throws Exception {
        try (Statement stmt = connection.createStatement()) {
            // 1. Apagar primeiro a tabela principal (Ticket)
            if (ticketIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM ticket WHERE id = " + ticketIdSalvo);
            }

            // 2. Apagar a Categoria
            if (categoryIdSalva != null) {
                stmt.executeUpdate("DELETE FROM category WHERE id = " + categoryIdSalva);
            }

            // 3. Apagar o registro da tabela filha 'client' PRIMEIRO
            if (clientIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM client WHERE user_id = " + clientIdSalvo);
                // OBS: Se a coluna FK na tabela client se chamar 'id' ou 'client_id', ajuste acima.

                // 4. E só depois apagar a tabela pai 'users'
                stmt.executeUpdate("DELETE FROM users WHERE id = " + clientIdSalvo);
            }

            // 5. Apagar o Endereço
            if (addressIdSalvo != null) {
                stmt.executeUpdate("DELETE FROM address WHERE id = " + addressIdSalvo);
            }
        }
        System.out.println("🧹 Limpeza concluída sem erros de FK!");
    }

    @Test
    @DisplayName("Deve criar um ticket com cliente, endereço e categoria com sucesso")
    void deveSalvarTicketComSucesso() throws Exception {
        // 1. Endereço
        Address address = new Address();
        long timestamp = System.currentTimeMillis();
        address.setStreet("Avenida Paulista");
        address.setNumber(String.valueOf(timestamp % 10000));
        address.setNeighborhood("Bela Vista");
        address.setCity("São Paulo");
        address.setState("SP");
        address.setZip_code("01310-100");

        Address addressSalvo = addressDao.save(address);
        assertNotNull(addressSalvo.getId(), "O ID do endereço não deveria ser nulo");
        this.addressIdSalvo = addressSalvo.getId();

        // 2. Cliente
        Client client = new Client();
        client.setName("Maria Oliveira");
        client.setEmail("maria." + timestamp + "@email.com");
        client.setPassword("senha123");
        client.setCpf(String.valueOf(timestamp).substring(0, 11));
        client.setCreatedTicketsCount(0);

        Client clientSalvo = clientDao.save(client);
        assertNotNull(clientSalvo.getId());
        this.clientIdSalvo = clientSalvo.getId();

        // 3. Categoria
        Category category = new Category();
        category.setName("Manutenção Elétrica");
        category.setDescription("Serviços relacionados a fiação, disjuntores e reparos elétricos");
        Category categorySalva = categoryDao.save(category);
        assertNotNull(categorySalva.getId(), "O ID da Categoria não deve ser nulo");
        this.categoryIdSalva = categorySalva.getId();

        // 4. Ticket
        Ticket ticket = new Ticket();
        ticket.setTitle("Troca de Disjuntor");
        ticket.setDescription("Disjuntor principal caindo constantemente.");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setStatus("OPEN");
        ticket.setClient(clientSalvo);
        ticket.setAddress(addressSalvo);
        ticket.setCategory(categorySalva);

        Ticket ticketSalvo = ticketDao.save(ticket);
        assertNotNull(ticketSalvo.getId(), "O ID do Ticket não deve ser nulo");
        this.ticketIdSalvo = ticketSalvo.getId(); // Guarda para o tearDown

        System.out.println("✅ TESTE PASSOU! Ticket ID: " + ticketSalvo.getId());
    }
}