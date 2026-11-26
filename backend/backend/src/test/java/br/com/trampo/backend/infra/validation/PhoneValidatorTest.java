package br.com.trampo.backend.infra.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PhoneValidatorTest {

    @Test
    void shouldNormalizeFormattedPhone() {
        assertEquals("35999999999", PhoneValidator.normalize("(35) 99999-9999"));
    }

    @Test
    void shouldAcceptValidMobilePhone() {
        assertTrue(PhoneValidator.isValid("35999999999"));
    }

    @Test
    void shouldRejectPhoneWithRepeatedDigits() {
        assertFalse(PhoneValidator.isValid("11111111111"));
    }
}
