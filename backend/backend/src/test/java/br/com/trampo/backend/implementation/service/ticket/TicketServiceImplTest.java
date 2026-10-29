package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.dto.address.CreateAddressDto;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketAvailableDayDto;
import br.com.trampo.backend.dto.ticket.TicketAvailableHourDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketStatusDto;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import br.com.trampo.backend.utils.TicketCodeGenerate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TicketServiceImplTest {

    @Mock
    private TicketCodeGenerate ticketCodeGenerate;

    @Mock
    private TicketDao ticketDao;

    @Mock
    private AddressDao addressDao;

    @Mock
    private AvailableDayDao availableDayDao;

    @Mock
    private AvailableHourDao availableHourDao;

    @Mock
    private CategoryService categoryService;

    @Mock
    private TicketMapper ticketMapper;

    @Mock
    private TicketPaymentMethodDao ticketPaymentMethodDao;

    @Mock
    private UsersDao usersDao;

    @InjectMocks
    private TicketServiceImpl ticketService;

    // Create
    @Test
    // Verifica se um ticket válido é criado e persistido com todos os seus dados relacionados.
    public void shouldCreateValidTicket() throws SQLException {
        Users user = validUser(false);
        Category category = new Category(2, "Elétrica", "eletrica.svg");
        CreateTicketDto createTicketDto = validCreateTicketDto();
        Ticket savedTicket = validTicket(user, StatusTicket.OPEN);
        TicketDto expected = mock(TicketDto.class);

        when(categoryService.findCategoryById(2)).thenReturn(category);
        when(ticketDao.save(any(Ticket.class))).thenReturn(savedTicket);
        when(ticketMapper.toDto(savedTicket, createTicketDto.paymentMethods(),
                List.of("MONDAY"), List.of("08:00"))).thenReturn(expected);

        TicketDto result = ticketService.createTicket(createTicketDto, user);

        assertSame(expected, result);
        ArgumentCaptor<Ticket> ticketCaptor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketDao).save(ticketCaptor.capture());
        assertEquals("Instalação elétrica", ticketCaptor.getValue().getTitle());
        assertEquals(category, ticketCaptor.getValue().getCategory());
        assertEquals(user, ticketCaptor.getValue().getUser());
        verify(availableDayDao).save(any(AvailableDay.class));
        verify(availableHourDao).save(any(AvailableHour.class));
        verify(ticketPaymentMethodDao).save(any(TicketPaymentMethod.class));
        verify(usersDao).incrementCreatedServicesCount(1);
    }

    @Test
    // Verifica se a criação é rejeitada quando o usuário não é informado.
    public void shouldRejectTicketWithoutUser() {
        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> ticketService.createTicket(validCreateTicketDto(), null)
        );

        assertEquals("Usuário e dados do ticket são obrigatórios.", exception.getMessage());
        verifyNoInteractions(ticketDao, categoryService, usersDao);
    }

    @Test
    // Verifica se a criação é rejeitada quando os dados do ticket não são informados.
    public void shouldRejectTicketWithoutData() {
        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> ticketService.createTicket(null, validUser(false))
        );

        assertEquals("Usuário e dados do ticket são obrigatórios.", exception.getMessage());
        verifyNoInteractions(ticketDao, categoryService, usersDao);
    }

    @Test
    // Verifica se a criação é rejeitada quando o preço máximo é inválido.
    public void shouldRejectTicketWithInvalidPrice() {
        CreateTicketDto createTicketDto = createTicketDtoWithPrice(BigDecimal.ZERO);

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> ticketService.createTicket(createTicketDto, validUser(false))
        );

        assertEquals("O orçamento máximo deve ser maior que zero.", exception.getMessage());
        verifyNoInteractions(ticketDao, categoryService, usersDao);
    }

    @Test
    // Verifica se uma falha do banco durante a criação é convertida em uma exceção de serviço.
    public void shouldWrapDatabaseErrorWhenCreatingTicket() throws SQLException {
        when(categoryService.findCategoryById(2)).thenReturn(new Category());
        when(ticketDao.save(any(Ticket.class))).thenThrow(new SQLException("falha", "08000"));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> ticketService.createTicket(validCreateTicketDto(), validUser(false))
        );

        assertEquals("Erro ao salvar ticket no banco de dados.", exception.getMessage());
        assertInstanceOf(SQLException.class, exception.getCause());
    }

    // Get my tickets
    @Test
    // Verifica se os tickets do usuário são retornados com seus detalhes relacionados.
    public void shouldReturnMyTicketsWithDetails() throws SQLException {
        Users user = validUser(false);
        Ticket ticket = validTicket(user, StatusTicket.OPEN);
        TicketDto ticketDto = mock(TicketDto.class);
        List<PaymentMethod> paymentMethods = List.of(PaymentMethod.PIX);
        List<String> availableDays = List.of("MONDAY");
        List<String> availableHours = List.of("08:00");

        when(ticketDao.findByUserId(1, List.of(StatusTicket.OPEN), 0, 10))
                .thenReturn(List.of(ticket));
        when(ticketPaymentMethodDao.findByTicketId(10)).thenReturn(paymentMethods);
        when(availableDayDao.findByTicketId(10)).thenReturn(availableDays);
        when(availableHourDao.findByTicketId(10)).thenReturn(availableHours);
        when(ticketMapper.toDto(ticket, paymentMethods, availableDays, availableHours))
                .thenReturn(ticketDto);

        PageDto<TicketDto> result = ticketService.getMyTickets(
                user, List.of(StatusTicket.OPEN), 0, 10
        );

        assertEquals(List.of(ticketDto), result.content());
        assertFalse(result.hasNext());
        verify(ticketDao).findByUserId(1, List.of(StatusTicket.OPEN), 0, 10);
    }

    @Test
    // Verifica se um usuário não autenticado não pode consultar seus tickets.
    public void shouldRejectMyTicketsForUnauthenticatedUser() {
        assertThrows(
                UnauthorizedUserException.class,
                () -> ticketService.getMyTickets(new Users(), null, 0, 10)
        );

        verifyNoInteractions(ticketDao);
    }
    

    // Get available tickets
    @Test
    // Verifica se um prestador recebe a lista de tickets disponíveis conforme os filtros.
    public void shouldReturnAvailableTicketsForProvider() throws SQLException {
        Users provider = validUser(true);
        Ticket ticket = validTicket(validUser(false), StatusTicket.OPEN);
        TicketDto ticketDto = mock(TicketDto.class);

        when(ticketDao.findAvailableForProvider(
                1, "Pouso Alegre", "MG", 2,
                new BigDecimal("100.00"), new BigDecimal("500.00"), 0, 10
        )).thenReturn(List.of(ticket));
        when(ticketMapper.toDto(ticket)).thenReturn(ticketDto);

        PageDto<TicketDto> result = ticketService.getAvailableTickets(
                provider, 2, new BigDecimal("100.00"), new BigDecimal("500.00"), 0, 10
        );

        assertEquals(List.of(ticketDto), result.content());
        assertFalse(result.hasNext());
    }

    @Test
    // Verifica se um cliente não pode consultar tickets disponíveis para prestadores.
    public void shouldRejectAvailableTicketsForCustomer() {
        Users customer = validUser(false);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ticketService.getAvailableTickets(customer, null, null, null, 0, 10)
        );

        assertEquals("Apenas prestadores podem consultar tickets disponíveis", exception.getMessage());
        verifyNoInteractions(ticketDao);
    }

    // Update ticket
    @Test
    // Verifica se os dados e relacionamentos de um ticket aberto são atualizados corretamente.
    public void shouldUpdateValidTicket() throws SQLException {
        Users user = validUser(false);
        Ticket ticket = validTicket(user, StatusTicket.OPEN);
        UpdateTicketDto updateTicketDto = validUpdateTicketDto();
        TicketDto expected = mock(TicketDto.class);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(ticketMapper.toDto(ticket, updateTicketDto.paymentMethods(),
                List.of("TUESDAY"), List.of("09:00"))).thenReturn(expected);

        TicketDto result = ticketService.updateTicket(10, updateTicketDto, user);

        assertSame(expected, result);
        assertEquals("Novo título", ticket.getTitle());
        assertEquals("Descrição atualizada", ticket.getDescription());
        assertEquals("MG", ticket.getAddress().getState());
        verify(addressDao).update(ticket.getAddress());
        verify(ticketDao).update(ticket);
        verify(availableDayDao).deleteByTicketId(10);
        verify(availableHourDao).deleteByTicketId(10);
        verify(ticketPaymentMethodDao).deleteByTicketId(10);
        verify(availableDayDao).save(any(AvailableDay.class));
        verify(availableHourDao).save(any(AvailableHour.class));
        verify(ticketPaymentMethodDao).save(any(TicketPaymentMethod.class));
    }

    @Test
    // Verifica se um usuário diferente do criador não pode atualizar o ticket.
    public void shouldNotUpdateTicketFromAnotherUser() throws SQLException {
        Ticket ticket = validTicket(validUser(false), StatusTicket.OPEN);
        Users anotherUser = validUser(false);
        anotherUser.setId(99);
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        assertThrows(
                UnauthorizedUserException.class,
                () -> ticketService.updateTicket(10, validUpdateTicketDto(), anotherUser)
        );

        verify(ticketDao, never()).update(any(Ticket.class));
        verifyNoInteractions(addressDao);
    }


    @Test
    // Verifica se uma atualização com título em branco é rejeitada.
    public void shouldRejectUpdateWithBlankTitle() throws SQLException {
        Users user = validUser(false);
        Ticket ticket = validTicket(user, StatusTicket.OPEN);
        UpdateTicketDto updateTicketDto = updateTicketDtoWithTitle("   ");
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        assertThrows(
                InvalidRequestException.class,
                () -> ticketService.updateTicket(10, updateTicketDto, user)
        );

        verify(ticketDao, never()).update(any(Ticket.class));
        verifyNoInteractions(addressDao);
    }


    @Test
    // Verifica se um horário disponível fora do formato permitido é rejeitado.
    public void shouldRejectUpdateWithInvalidAvailableHour() throws SQLException {
        Users user = validUser(false);
        Ticket ticket = validTicket(user, StatusTicket.OPEN);
        UpdateTicketDto valid = validUpdateTicketDto();
        UpdateTicketDto updateTicketDto = new UpdateTicketDto(
                valid.title(), valid.description(), valid.priceMax(),
                List.of(new TicketAvailableHourDto("05:30")), valid.availableDays(),
                valid.paymentMethods(), valid.addressDto()
        );
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        assertThrows(
                InvalidRequestException.class,
                () -> ticketService.updateTicket(10, updateTicketDto, user)
        );

        verify(ticketDao, never()).update(any(Ticket.class));
    }

    // Update status
    @Test
    // Verifica se um ticket aberto pode ser cancelado pelo seu criador.
    public void shouldCancelOpenTicket() throws SQLException {
        Users user = validUser(false);
        Ticket openTicket = validTicket(user, StatusTicket.OPEN);
        Ticket cancelledTicket = validTicket(user, StatusTicket.CANCELLED);
        TicketDto expected = mock(TicketDto.class);

        when(ticketDao.findById(10))
                .thenReturn(Optional.of(openTicket))
                .thenReturn(Optional.of(cancelledTicket));
        when(ticketPaymentMethodDao.findByTicketId(10)).thenReturn(List.of(PaymentMethod.PIX));
        when(availableDayDao.findByTicketId(10)).thenReturn(List.of("MONDAY"));
        when(availableHourDao.findByTicketId(10)).thenReturn(List.of("08:00"));
        when(ticketMapper.toDto(cancelledTicket, List.of(PaymentMethod.PIX),
                List.of("MONDAY"), List.of("08:00"))).thenReturn(expected);

        TicketDto result = ticketService.updateStatus(
                10, new UpdateTicketStatusDto(" cancelled "), user
        );

        assertSame(expected, result);
        verify(ticketDao).updateStatus(10, StatusTicket.CANCELLED);
        verify(usersDao, never()).incrementCompletedServicesCountForTicket(anyInt());
    }

    @Test
    // Verifica se a conclusão do ticket incrementa o total de serviços concluídos.
    public void shouldCompleteInProgressTicketAndIncrementUserCount() throws SQLException {
        Users user = validUser(false);
        Ticket inProgressTicket = validTicket(user, StatusTicket.IN_PROGRESS);
        Ticket completedTicket = validTicket(user, StatusTicket.COMPLETED);

        when(ticketDao.findById(10))
                .thenReturn(Optional.of(inProgressTicket))
                .thenReturn(Optional.of(completedTicket));
        when(ticketPaymentMethodDao.findByTicketId(10)).thenReturn(List.of());
        when(availableDayDao.findByTicketId(10)).thenReturn(List.of());
        when(availableHourDao.findByTicketId(10)).thenReturn(List.of());

        ticketService.updateStatus(10, new UpdateTicketStatusDto("COMPLETED"), user);

        verify(ticketDao).updateStatus(10, StatusTicket.COMPLETED);
        verify(usersDao).incrementCompletedServicesCountForTicket(10);
    }

    @Test
    // Verifica se um nome de status inexistente é rejeitado.
    public void shouldRejectInvalidStatus() throws SQLException {
        Users user = validUser(false);
        when(ticketDao.findById(10)).thenReturn(Optional.of(validTicket(user, StatusTicket.OPEN)));

        assertThrows(
                InvalidRequestException.class,
                () -> ticketService.updateStatus(10, new UpdateTicketStatusDto("UNKNOWN"), user)
        );

        verify(ticketDao, never()).updateStatus(anyInt(), any(StatusTicket.class));
    }

    @Test
    // Verifica se uma transição de status não permitida é rejeitada.
    public void shouldRejectInvalidStatusTransition() throws SQLException {
        Users user = validUser(false);
        when(ticketDao.findById(10)).thenReturn(Optional.of(validTicket(user, StatusTicket.OPEN)));

        assertThrows(
                InvalidRequestException.class,
                () -> ticketService.updateStatus(10, new UpdateTicketStatusDto("COMPLETED"), user)
        );

        verify(ticketDao, never()).updateStatus(anyInt(), any(StatusTicket.class));
    }

    // Find by id
    @Test
    // Verifica se um ticket existente é encontrado pelo seu identificador.
    public void shouldFindTicketById() throws SQLException {
        Ticket ticket = validTicket(validUser(false), StatusTicket.OPEN);
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        Ticket result = ticketService.findTicketById(10);

        assertSame(ticket, result);
        verify(ticketDao).findById(10);
    }

    @Test
    // Verifica se a busca por um ticket inexistente lança a exceção esperada.
    public void shouldRejectWhenTicketDoesNotExist() throws SQLException {
        when(ticketDao.findById(99)).thenReturn(Optional.empty());

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> ticketService.findTicketById(99)
        );

        assertEquals("Ticket não encontrado.", exception.getMessage());
    }

    // Métodos auxiliares para os testes da classe

    // Cria um usuário válido para reutilização nos cenários de teste.
    private Users validUser(boolean provider) {
        Users user = new Users();
        user.setId(1);
        user.setName("Maria");
        user.setProvider(provider);
        user.setCity("Pouso Alegre");
        user.setState("MG");
        return user;
    }

    // Cria um ticket válido com usuário e status definidos para os testes.
    private Ticket validTicket(Users user, StatusTicket status) {
        Ticket ticket = new Ticket();
        ticket.setId(10);
        ticket.setCode("TCK-12345678");
        ticket.setTitle("Instalação elétrica");
        ticket.setDescription("Instalar uma nova tomada");
        ticket.setPriceMax(new BigDecimal("300.00"));
        ticket.setStatus(status);
        ticket.setUser(user);
        ticket.setCategory(new Category(2, "Elétrica", "eletrica.svg"));
        ticket.setAddress(new Address(
                5, "Rua A", "100", "Centro", "Pouso Alegre", "MG",
                "37550-000", "Casa", user
        ));
        return ticket;
    }

    // Cria os dados válidos necessários para testar a criação de um ticket.
    private CreateTicketDto validCreateTicketDto() {
        return createTicketDtoWithPrice(new BigDecimal("300.00"));
    }

    // Cria os dados de um ticket com o preço máximo recebido no parâmetro.
    private CreateTicketDto createTicketDtoWithPrice(BigDecimal price) {
        return new CreateTicketDto(
                "Instalação elétrica",
                "Instalar uma nova tomada",
                price,
                2,
                List.of(new TicketAvailableHourDto("08:00")),
                List.of(new TicketAvailableDayDto("MONDAY")),
                List.of(PaymentMethod.PIX),
                validAddressDto()
        );
    }

    // Cria os dados válidos necessários para testar a atualização de um ticket.
    private UpdateTicketDto validUpdateTicketDto() {
        return updateTicketDtoWithTitle(" Novo título ");
    }

    // Cria os dados de atualização utilizando o título recebido no parâmetro.
    private UpdateTicketDto updateTicketDtoWithTitle(String title) {
        return new UpdateTicketDto(
                title,
                " Descrição atualizada ",
                new BigDecimal("450.00"),
                List.of(new TicketAvailableHourDto("09:00")),
                List.of(new TicketAvailableDayDto("TUESDAY")),
                List.of(PaymentMethod.PIX),
                validAddressDto()
        );
    }

    // Cria um endereço válido para reutilização nos dados de criação e atualização.
    private CreateAddressDto validAddressDto() {
        return new CreateAddressDto(
                " Rua Nova ", "200", "Centro", "Pouso Alegre",
                "mg", "37550-000", "Apto 1"
        );
    }
}
