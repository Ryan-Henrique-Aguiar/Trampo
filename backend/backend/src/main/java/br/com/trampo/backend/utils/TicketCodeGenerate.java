package br.com.trampo.backend.utils;

import lombok.experimental.UtilityClass;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class TicketCodeGenerate {

    public static String generate() {
        // Exemplo: TCK- + 8 caracteres hexadecimais em caixa alta
        String hash = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "TCK-" + hash;
    }
}
