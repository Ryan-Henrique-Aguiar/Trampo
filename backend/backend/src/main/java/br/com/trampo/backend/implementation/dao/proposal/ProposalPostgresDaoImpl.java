package br.com.trampo.backend.implementation.dao.proposal;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.domain.ticket.Proposal;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.proposal.ProposalDao;

import javax.sql.DataSource;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ProposalPostgresDaoImpl implements ProposalDao {

    private final DataSource dataSource;

    public ProposalPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Proposal save(Proposal proposal) {
        String sql = """
                INSERT INTO proposal (price_range, professional_id, ticket_id)
                VALUES (?, ?, ?)
                RETURNING id, status
                """;

        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setBigDecimal(1, proposal.getPriceRange());
            statement.setInt(2, proposal.getProfessional().getId());
            statement.setInt(3, proposal.getTicket().getId());

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    proposal.setId(resultSet.getInt("id"));
                    proposal.setStatus(StatusProposal.valueOf(resultSet.getString("status")));
                }
            }

            return proposal;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar proposta.", e);
        }
    }

    @Override
    public Optional<Proposal> findById(int id) {
        String sql = baseSelect() + " WHERE p.id = ?";
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, id);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return Optional.of(mapProposal(resultSet));
                }
            }

            return Optional.empty();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar proposta.", e);
        }
    }

    @Override
    public List<Proposal> findByTicketId(int ticketId) {
        String sql = baseSelect() + " WHERE p.ticket_id = ? ORDER BY p.id DESC";
        return findAll(sql, ticketId);
    }

    @Override
    public List<Proposal> findByTicketIdAndProfessionalId(int ticketId, int professionalId) {
        String sql = baseSelect()
                + " WHERE p.ticket_id = ? AND p.professional_id = ? ORDER BY p.id DESC";
        List<Proposal> proposals = new ArrayList<>();

        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);
            statement.setInt(2, professionalId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    proposals.add(mapProposal(resultSet));
                }
            }

            return proposals;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar proposta do prestador.", e);
        }
    }

    @Override
    public boolean existsByTicketIdAndProfessionalId(int ticketId, int professionalId) {
        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM proposal
                    WHERE ticket_id = ?
                      AND professional_id = ?
                )
                """;
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);
            statement.setInt(2, professionalId);

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getBoolean(1);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar proposta existente.", e);
        }
    }

    @Override
    public boolean canProfessionalPropose(int ticketId, int professionalId) {
        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM ticket t
                    INNER JOIN address a ON a.id = t.address_id
                    INNER JOIN users u ON u.id = ?
                    INNER JOIN user_category uc
                        ON uc.user_id = u.id
                       AND uc.category_id = t.category_id
                    WHERE t.id = ?
                      AND t.status = 'OPEN'
                      AND t.user_id <> u.id
                      AND u.is_provider = TRUE
                      AND LOWER(TRIM(a.city)) = LOWER(TRIM(u.city))
                      AND UPPER(TRIM(a.state)) = UPPER(TRIM(u.state))
                )
                """;
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, professionalId);
            statement.setInt(2, ticketId);

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getBoolean(1);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao validar prestador para a proposta.", e);
        }
    }

    @Override
    public Proposal updateStatus(Proposal proposal, StatusProposal status) {
        String sql = "UPDATE proposal SET status = ? WHERE id = ?";
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status.name());
            statement.setInt(2, proposal.getId());
            statement.executeUpdate();
            proposal.setStatus(status);
            return proposal;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar status da proposta.", e);
        }
    }

    @Override
    public void rejectOtherPending(int ticketId, int acceptedProposalId) {
        String sql = """
                UPDATE proposal
                SET status = 'REJECTED'
                WHERE ticket_id = ?
                  AND id <> ?
                  AND status = 'PENDING'
                """;
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);
            statement.setInt(2, acceptedProposalId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao rejeitar propostas concorrentes.", e);
        }
    }

    private List<Proposal> findAll(String sql, int ticketId) {
        List<Proposal> proposals = new ArrayList<>();

        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    proposals.add(mapProposal(resultSet));
                }
            }

            return proposals;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar propostas do ticket.", e);
        }
    }

    private String baseSelect() {
        return """
                SELECT
                    p.id,
                    p.price_range,
                    p.status,
                    p.professional_id,
                    p.ticket_id,
                    u.name AS professional_name,
                    u.phone AS professional_phone
                FROM proposal p
                INNER JOIN users u ON u.id = p.professional_id
                """;
    }

    private Proposal mapProposal(ResultSet resultSet) throws SQLException {
        Users professional = new Users();
        professional.setId(resultSet.getInt("professional_id"));
        professional.setName(resultSet.getString("professional_name"));
        professional.setPhone(resultSet.getString("professional_phone"));

        Ticket ticket = new Ticket();
        ticket.setId(resultSet.getInt("ticket_id"));

        Proposal proposal = new Proposal();
        proposal.setId(resultSet.getInt("id"));
        proposal.setPriceRange(resultSet.getBigDecimal("price_range"));
        proposal.setStatus(StatusProposal.valueOf(resultSet.getString("status")));
        proposal.setProfessional(professional);
        proposal.setTicket(ticket);
        return proposal;
    }
}
