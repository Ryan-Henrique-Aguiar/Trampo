package br.com.trampo.backend.implementation.dao.review;

import br.com.trampo.backend.domain.Review;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.review.ReviewDao;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ReviewPostgresDaoImpl implements ReviewDao {

    private final DataSource dataSource;

    public ReviewPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Review save(Review review) {
        String sql = """
                INSERT INTO review (score, comment, ticket_id, reviewer_id, reviewed_user_id)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id, created_at
                """;

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, review.getScore());
            statement.setString(2, review.getComment());
            statement.setInt(3, review.getTicketId());
            statement.setInt(4, review.getReviewerId());
            statement.setInt(5, review.getReviewedUserId());

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    review.setId(resultSet.getInt("id"));
                    review.setCreatedAt(resultSet.getTimestamp("created_at").toLocalDateTime());
                }
            }
            return review;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar avaliação.", e);
        }
    }

    @Override
    public boolean existsByTicketAndReviewer(int ticketId, int reviewerId) {
        String sql = "SELECT EXISTS (SELECT 1 FROM review WHERE ticket_id = ? AND reviewer_id = ?)";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);
            statement.setInt(2, reviewerId);

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getBoolean(1);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao consultar avaliação.", e);
        }
    }

    @Override
    public List<Review> findByReviewedUserId(int userId) {
        String sql = """
                SELECT r.*
                FROM review r
                WHERE r.reviewed_user_id = ?
                ORDER BY r.created_at DESC
                """;
        List<Review> reviews = new ArrayList<>();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    reviews.add(mapReview(resultSet));
                }
            }
            return reviews;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar avaliações.", e);
        }
    }

    @Override
    public void updateUserRating(int userId) {
        String sql = """
                UPDATE users
                SET rating = (
                    SELECT ROUND(AVG(score), 1)
                    FROM review
                    WHERE reviewed_user_id = ?
                )
                WHERE id = ?
                """;

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);
            statement.setInt(2, userId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar nota do usuário.", e);
        }
    }

    private Review mapReview(ResultSet resultSet) throws SQLException {
        return new Review(
                resultSet.getInt("id"),
                resultSet.getInt("score"),
                resultSet.getString("comment"),
                resultSet.getInt("ticket_id"),
                resultSet.getInt("reviewer_id"),
                resultSet.getInt("reviewed_user_id"),
                resultSet.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
