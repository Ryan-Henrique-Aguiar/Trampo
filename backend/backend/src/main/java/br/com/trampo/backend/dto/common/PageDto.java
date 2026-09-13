package br.com.trampo.backend.dto.common;

import java.util.List;

public record PageDto<T>(
        List<T> content,
        boolean hasNext
) {
}
