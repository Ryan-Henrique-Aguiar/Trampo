package br.com.trampo.backend.domain.user;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Professional extends Users {
    private LocalDate service_start_date;
    private int completed_services_count;
}
