package br.com.trampo.backend.implementation.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.domain.ticket.TicketImage;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.port.dao.ticket.TicketImageDao;
import br.com.trampo.backend.port.service.ticket.TicketImageService;
import br.com.trampo.backend.port.service.ticket.TicketService;
import br.com.trampo.backend.port.service.tools.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Service
public class TicketImageServiceImpl implements TicketImageService {

    private final FileStorageService fileStorageService;
    private final TicketService ticketService;
    private final TicketImageDao ticketImageDao;

    public TicketImageServiceImpl(
            FileStorageService fileStorageService,
            TicketService ticketService,
            TicketImageDao ticketImageDao
    ) {
        this.fileStorageService = fileStorageService;
        this.ticketService = ticketService;
        this.ticketImageDao = ticketImageDao;
    }

    private boolean isSupportedImageType(String contentType) {
        return contentType.equals("image/jpeg")
                || contentType.equals("image/png")
                || contentType.equals("image/webp");
    }

    @Override
    public void uploadImages(
            Integer ticketId,
            List<MultipartFile> files,
            Users user
    ) {

        Ticket ticket = ticketService.findTicketById(ticketId);

        if (!Objects.equals(user.getId(), ticket.getUser().getId())) {
            throw new UnauthorizedUserException(
                    "Esse ticket não pertence ao usuário."
            );
        }

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException(
                    "Nenhuma imagem foi enviada."
            );
        }

        for (MultipartFile file : files) {

            if (file == null || file.isEmpty()) {
                continue;
            }
            String contentType = file.getContentType();
            if (contentType == null || !isSupportedImageType(contentType)) {
                throw new IllegalArgumentException(
                        "Tipo de arquivo não suportado: " + contentType + ". Envie apenas imagens (JPEG, PNG ou WEBP)."
                );
            }

            String filePath = fileStorageService.save(
                    file,
                    "tickets/" + ticketId
            );

            TicketImage ticketImage = new TicketImage();
            ticketImage.setTicket(ticket);
            ticketImage.setFileName(file.getOriginalFilename());
            ticketImage.setFilePath(filePath);
            ticketImage.setFileSize(file.getSize());
            ticketImage.setContentType(file.getContentType());


            ticketImageDao.save(ticketImage);
        }
    }

    @Override
    public List<TicketImage> findByTicketId(Integer ticketId) {
        if (ticketId == null || ticketId <= 0) {
            throw new IllegalArgumentException("Ticket inválido.");
        }

        // Busca as imagens pelo DAO
        List<TicketImage> images = ticketImageDao.findByTicketId(ticketId);

        if (images.isEmpty()) {
            return images;
        }

        // Busca o objeto completo do Ticket apenas UMA vez
        Ticket ticketCompleto = ticketService.findTicketById(ticketId);

        // tualiza a referência em cada imagem
        for (TicketImage image : images) {
            image.setTicket(ticketCompleto);
        }

        return images;
    }

    @Override
    public Resource getImage(Integer imageId) {

        if (imageId == null || imageId <= 0) {
            throw new IllegalArgumentException(
                    "Imagem inválida."
            );
        }

        TicketImage image = ticketImageDao.findById(imageId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Imagem não encontrada."
                        )
                );

        return fileStorageService.load(image.getFilePath());
    }

    @Override
    public void deleteImage(Integer imageId, Users user) {

        if (imageId == null || imageId <= 0) {
            throw new IllegalArgumentException(
                    "Imagem inválida."
            );
        }

        TicketImage image = ticketImageDao.findById(imageId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Imagem não encontrada."
                        )
                );

        Ticket ticket = ticketService.findTicketById(
                image.getId()
        );

        if (!Objects.equals(user.getId(), ticket.getUser().getId())) {
            throw new UnauthorizedUserException(
                    "Essa imagem não pertence a um ticket do usuário."
            );
        }

        fileStorageService.delete(image.getFilePath());

        ticketImageDao.deleteById(imageId);
    }
}
