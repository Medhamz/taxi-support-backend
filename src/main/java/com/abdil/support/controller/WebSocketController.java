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
        log.info("📩 Message reçu pour le ticket: {}", chatMessage.getTicketId());

        Message savedMessage = ticketService.saveWebSocketMessage(chatMessage);
        String destination = "/topic/ticket/" + savedMessage.getTicketId();

        // ✅ Utilisation de convertAndSend avec Object
        messagingTemplate.convertAndSend(destination, savedMessage);

        notificationService.notifyNewMessageWebSocket(savedMessage);
        ticketService.markMessageAsRead(savedMessage.getId());

        log.info("✅ Message envoyé vers: {}", destination);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingIndicator typing) {
        String destination = "/topic/ticket/" + typing.getTicketId() + "/typing";
        messagingTemplate.convertAndSend(destination, typing);
        log.info("✍️ {} est en train d'écrire", typing.getUserName());
    }

    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ReadReceipt receipt) {
        ticketService.markMessagesAsRead(receipt.getTicketId(), receipt.getUserId());
        String destination = "/topic/ticket/" + receipt.getTicketId() + "/read";
        messagingTemplate.convertAndSend(destination, receipt);
        log.info("👀 Messages lus par {}", receipt.getUserName());
    }
}