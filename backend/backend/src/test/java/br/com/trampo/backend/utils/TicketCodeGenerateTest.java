package br.com.trampo.backend.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class TicketCodeGenerateTest {

    @Test
    public void shouldGenerateCodeWithExpectedFormat() {
        String ticketCode = TicketCodeGenerate.generate();

        assertTrue(ticketCode.matches("TCK-[0-9A-F]{8}"));
    }
}
