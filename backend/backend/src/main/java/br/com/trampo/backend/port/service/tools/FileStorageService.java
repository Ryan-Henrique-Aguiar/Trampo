package br.com.trampo.backend.port.service.tools;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String save(MultipartFile file, String folder);

    void delete(String filePath);

    Resource load(String filePath);
}
