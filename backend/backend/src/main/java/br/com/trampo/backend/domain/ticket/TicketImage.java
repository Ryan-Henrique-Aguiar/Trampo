package br.com.trampo.backend.domain.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketImage {
    private int id;
    private Ticket ticket;
    private String fileName;
    private String filePath;
    private String contentType;
    private long fileSize;
    private LocalDateTime createdAt;

    public TicketImage(Ticket ticket, String fileName, String filePath, long fileSize, String contentType, LocalDateTime createdAt) {

        this.ticket = ticket;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;

        this.createdAt = LocalDateTime.now();
    }
}
