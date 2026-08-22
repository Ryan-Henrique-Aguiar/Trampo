package br.com.trampo.backend.infra.validation;

public final class CpfValidator {

    private CpfValidator() {
    }

    public static String normalize(String cpf) {
        if (cpf == null) {
            return "";
        }

        return cpf.replaceAll("\\D", "");
    }

    public static boolean isValid(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}")) {
            return false;
        }

        String normalizedCpf = normalize(cpf);

        if (normalizedCpf.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateDigit(normalizedCpf, 9);
        int secondDigit = calculateDigit(normalizedCpf, 10);

        return firstDigit == Character.getNumericValue(normalizedCpf.charAt(9))
                && secondDigit == Character.getNumericValue(normalizedCpf.charAt(10));
    }

    private static int calculateDigit(String cpf, int length) {
        int sum = 0;
        int weight = length + 1;

        for (int index = 0; index < length; index++) {
            int digit = Character.getNumericValue(cpf.charAt(index));
            sum += digit * (weight - index);
        }

        int result = 11 - (sum % 11);

        return result >= 10 ? 0 : result;
    }
}
