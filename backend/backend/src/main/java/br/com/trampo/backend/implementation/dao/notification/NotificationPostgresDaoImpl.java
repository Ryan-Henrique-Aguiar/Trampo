package br.com.trampo.backend.implementation.dao.notification;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.notification.Notification;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.notification.NotificationDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;


@Repository
public class NotificationPostgresDaoImpl implements NotificationDao {

    private DataSource dataSource;
    private final TicketDao ticketDao;
    private final UsersDao userDao;

    public NotificationPostgresDaoImpl(DataSource dataSource, TicketDao ticketDao, UsersDao userDao) {
        this.dataSource = dataSource;
        this.ticketDao = ticketDao;
        this.userDao = userDao;
    }


    @Override
    public Notification save(Notification notification) {
        try {
            String sql = "INSERT INTO notification (message, ticket_id, user_id) VALUES (?, ?, ?) RETURNING id";

            try (Connection connection = dataSource.getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
                preparedStatement.setString(1, notification.getMessage());
                preparedStatement.setInt(2, notification.getTicket().getId());
                preparedStatement.setInt(3, notification.getUser().getId());
                try (ResultSet resultSet = preparedStatement.executeQuery()) {
                    if (resultSet.next()) {
                        notification.setId(resultSet.getInt(1));
                    }
                }
            }
            return notification;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao Salvar a Notificação.", e);
        }

    }

    @Override
    public List<Notification> findAllNotificationsByUserId(Integer userId) {
        try {
            List<Notification> notifications = new ArrayList<>();
            
            String sql = "SELECT * FROM notification WHERE user_id = ? AND is_read = false ORDER BY created_at DESC";

            try (Connection connection = dataSource.getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {


                preparedStatement.setInt(1, userId);

                ResultSet resultSet = preparedStatement.executeQuery();
                while (resultSet.next()) {
                    notifications.add(mapResultSetToNotification(resultSet));
                }
                return notifications;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar as Notificações.", e);
        }
    }

    private Notification mapResultSetToNotification(ResultSet resultSet) throws SQLException {
        Notification notification = new Notification();
        notification.setId(resultSet.getInt("id"));
        notification.setMessage(resultSet.getString("message"));
        notification.setCreatedAt(resultSet.getTimestamp("created_at").toLocalDateTime());
        notification.setIsRead(resultSet.getBoolean("is_read"));

        // .orElseThrow() para extrair o objeto do Optional
        Ticket ticket = ticketDao.findById(resultSet.getInt("ticket_id"))
                .orElseThrow(() -> new RuntimeException("Ticket não encontrado para esta notificação"));
        notification.setTicket(ticket);

        // .orElseThrow() para extrair o objeto do Optional
        Users user = userDao.findById(resultSet.getInt("user_id"))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para esta notificação"));
        notification.setUser(user);

        return notification;
    }

}
