package com.abdil.support.controller;

import com.abdil.support.dto.ChatMessage;
import com.abdil.support.model.Message;
import com.abdil.support.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support/messages")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MessageController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody ChatMessage chatMessage) {
        log.info("📩 Message reçu pour le ticket: {}", chatMessage.getTicketId());
        Message savedMessage = ticketService.saveWebSocketMessage(chatMessage);
        return ResponseEntity.ok(savedMessage);
    }
}