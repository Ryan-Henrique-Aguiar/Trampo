package br.com.trampo.backend.controller.notification;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.notification.ResponseNotificationDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/notification")
public class NotificationController {

    @GetMapping()
    public ResponseEntity<ResponseNotificationDto> getNotification(@AuthenticationPrincipal Users user) {
        ResponseNotificationDto responseNotificationDto = null;
        return ResponseEntity.status(HttpStatus.OK).body(responseNotificationDto);
    }
}
