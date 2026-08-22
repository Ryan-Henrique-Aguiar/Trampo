package br.com.trampo.backend.infra.validation;

public final class PhoneValidator {

    private PhoneValidator() {
    }

    public static String normalize(String phone) {
        if (phone == null) {
            return "";
        }

        return phone.replaceAll("\\D", "");
    }

    public static boolean isValid(String phone) {
        String normalizedPhone = normalize(phone);

        if (!normalizedPhone.matches("\\d{11}")) {
            return false;
        }

        if (normalizedPhone.chars().distinct().count() == 1) {
            return false;
        }

        if (normalizedPhone.charAt(0) == '0') {
            return false;
        }

        return normalizedPhone.length() != 11
                || normalizedPhone.charAt(2) == '9';
    }
}