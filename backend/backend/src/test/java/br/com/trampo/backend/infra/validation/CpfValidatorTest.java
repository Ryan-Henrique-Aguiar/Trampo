package br.com.trampo.backend.infra.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CpfValidatorTest {

    @Test
    void shouldNormalizeFormattedCpf() {
        assertEquals("52998224725", CpfValidator.normalize("529.982.247-25"));
    }

    @Test
    void shouldAcceptValidCpf() {
        assertTrue(CpfValidator.isValid("52998224725"));
    }

    @Test
    void shouldRejectCpfWithRepeatedDigits() {
        assertFalse(CpfValidator.isValid("11111111111"));
    }
}
