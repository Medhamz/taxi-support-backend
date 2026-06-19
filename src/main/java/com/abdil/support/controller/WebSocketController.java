package com.abdil.support.controller;

import com.abdil.support.dto.ChatMessage;
import com.abdil.support.dto.ReadReceipt;
import com.abdil.support.dto.TypingIndicator;
import com.abdil.support.model.Message;
import com.abdil.support.service.NotificationService;
import com.abdil.support.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final TicketService ticketService;
    private final NotificationService notificationService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        log.info("Message reçu: {}", chatMessage);

        // Sauvegarder le message
        Message savedMessage = ticketService.saveWebSocketMessage(chatMessage);

        // Envoyer à tous les participants du ticket
        String destination = "/topic/ticket/" + chatMessage.getTicketId();
        messagingTemplate.convertAndSend(destination, savedMessage);

        // Notifier l'autre partie (si connectée)
        notificationService.notifyNewMessageWebSocket(savedMessage);

        // Marquer le message comme lu
        ticketService.markMessageAsRead(savedMessage.getId());
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingIndicator typing) {
        String destination = "/topic/ticket/" + typing.getTicketId() + "/typing";
        messagingTemplate.convertAndSend(destination, typing);
        log.info("✍️ {} est en train d'écrire...", typing.getUserName());
    }

    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ReadReceipt receipt) {
        ticketService.markMessagesAsRead(receipt.getTicketId(), receipt.getUserId());

        String destination = "/topic/ticket/" + receipt.getTicketId() + "/read";
        messagingTemplate.convertAndSend(destination, receipt);
        log.info("👀 Messages lus par {}", receipt.getUserName());
    }
}