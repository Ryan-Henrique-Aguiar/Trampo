package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.domain.ticket.TicketImage;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.TicketImageDao;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class TicketImagePostgresDaoImpl implements TicketImageDao {

    private DataSource dataSource;

    public TicketImagePostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(TicketImage image) {
        String sql = """
                INSERT INTO ticket_image
                (
                    ticket_id,
                    file_name,
                    file_path,
                    content_type,
                    file_size
                )
                VALUES (?, ?, ?, ?, ?)
                """;
        try (Connection connection = dataSource.getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            preparedStatement.setInt(1, image.getTicket().getId());
            preparedStatement.setString(2, image.getFileName());
            preparedStatement.setString(3, image.getFilePath());
            preparedStatement.setString(4, image.getContentType());
            preparedStatement.setLong(5, image.getFileSize());

        } catch (SQLException e) {
            throw new DatabaseException("Não foi possível salvar a imagem", e);
        }
    }

    @Override
    public List<TicketImage> findByTicketId(Integer ticketId) {
        String sql = """
                SELECT
                    id,
                    ticket_id,
                    file_name,
                    file_path,
                    content_type,
                    file_size,
                    created_at
                FROM ticket_image
                WHERE ticket_id = ?
                ORDER BY created_at
                """;
        List<TicketImage> images = new ArrayList<>();

        try (Connection connection = dataSource.getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            preparedStatement.setInt(1, ticketId);

            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                while (resultSet.next()) {
                    // Instancia o objeto Ticket contendo apenas o ID
                    Ticket ticket = new Ticket();
                    ticket.setId(resultSet.getInt("ticket_id"));

                    Timestamp timestamp = resultSet.getTimestamp("created_at");

                    TicketImage image = new TicketImage(
                            resultSet.getInt("id"),
                            ticket,
                            resultSet.getString("file_name"),
                            resultSet.getString("file_path"),
                            resultSet.getString("content_type"),
                            resultSet.getLong("file_size"),
                            timestamp != null ? timestamp.toLocalDateTime() : null
                    );

                    images.add(image);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException(
                    "Erro ao buscar imagens do ticket.",
                    e
            );
        }
        return images;
    }

    @Override
    public Optional<TicketImage> findById(Integer imageId) {
        return Optional.empty();
    }

    @Override
    public void deleteById(Integer imageId) {

    }

    @Override
    public void deleteByTicketId(Integer ticketId) {

    }
}
