package br.com.trampo.backend.implementation.service.tools;

import br.com.trampo.backend.port.service.tools.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

public class LocalFileStorageService implements FileStorageService {

    private final Path uploadDirectory;


    /**
     * 1. Injeção de Propriedade via @Value: Utiliza a anotação @Value("${file.upload-dir:/app/uploads}")
     * para buscar o diretório de uploads diretamente nas configurações da aplicação
     * (application.properties/yml), assumindo um valor padrão (/app/uploads) caso não esteja definido.
     * 2. Normalização e Caminho Absoluto: Converte a string recebida em um caminho absoluto e
     * normalizado, garantindo segurança contra inconsistências independentemente de onde a aplicação execute.
     * 3. Criação Automática no Arranque (Fail-Fast): Logo na inicialização do bean pelo Spring,
     * executa Files.createDirectories(...) para criar fisicamente a pasta no disco se ela não existir.
     * Se houver falha de permissão ou de I/O, lança uma RuntimeException, impedindo que a aplicação
     * suba sem o ambiente devidamente preparado.
     */
    public LocalFileStorageService(
            @Value("${file.upload-dir:/app/uploads}") String uploadDir
    ) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de uploads", e);
        }
    }

    /**
     * Responsável por receber um arquivo enviado via requisição HTTP (MultipartFile)
     * e gravá-lo de forma organizada e segura em uma subpasta específica.
     * <p>
     * Passo a passo:
     * 1. Validações: Verifica se o arquivo é nulo/vazio e se o nome original é válido (lança IllegalArgumentException se falhar).
     * 2. Geração de Nome Único: Extrai a extensão original e gera um identificador único universal (UUID)
     * combinado com essa extensão, prevenindo colisões de nomes duplicados no servidor.
     * 3. Segurança de Caminho (Path Traversal): Resolve o caminho final combinando o diretório base com a
     * pasta de destino, validando se o resultado permanece contido dentro do diretório permitido.
     * 4. Escrita no Disco: Cria a subpasta caso não exista, copia o fluxo de dados para o disco
     * usando Files.copy e retorna o caminho relativo formatado.
     */

    @Override
    public String save(MultipartFile file, String folder) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode ser vazio");
        }

        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("Nome do arquivo inválido");
        }

        String extension = "";

        int extensionIndex = originalFileName.lastIndexOf('.');

        if (extensionIndex >= 0) {
            extension = originalFileName.substring(extensionIndex);
        }

        String fileName = UUID.randomUUID() + extension;

        Path folderPath = uploadDirectory.resolve(folder);

        try {
            Files.createDirectories(folderPath);

            Path filePath = folderPath.resolve(fileName).normalize();

            if (!filePath.startsWith(folderPath)) {
                throw new SecurityException("Caminho de arquivo inválido");
            }

            Files.copy(file.getInputStream(), filePath);

            return folder + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo", e);
        }
    }

    /**
     * Responsável por remover fisicamente um arquivo armazenado no servidor com base
     * no caminho relativo fornecido.
     * <p>
     * Passo a passo:
     * 1. Validação de Entrada: Se o caminho do arquivo for nulo ou vazio, a execução é encerrada antecipadamente.
     * 2. Resolução Segura: Mapeia o caminho relativo com o diretório base de uploads via .resolve() e .normalize().
     * 3. Exclusão Condicional: Executa Files.deleteIfExists(path), removendo o arquivo com segurança
     * caso ele exista no disco.
     */
    @Override
    public void delete(String filePath) {

        if (filePath == null || filePath.isBlank()) {
            return;
        }

        Path path = uploadDirectory
                .resolve(filePath)
                .normalize();

        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao excluir arquivo", e);
        }
    }
}
