package com.abdil.support.service;

import com.abdil.support.dto.*;
import com.abdil.support.model.Message;
import com.abdil.support.model.Ticket;
import com.abdil.support.model.TicketStatus;  // ✅ IMPORTANT : Utiliser le model
import com.abdil.support.repository.MessageRepository;
import com.abdil.support.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final MessageRepository messageRepository;

    // ============================================
    // MÉTHODES DE GESTION DES TICKETS
    // ============================================

    @Transactional
    public TicketResponse createTicket(TicketRequest request) {
        Ticket ticket = new Ticket();
        ticket.setTicketNumber("TCK-" + System.currentTimeMillis());
        ticket.setUserId(request.getUserId());
        ticket.setUserType(request.getUserType());
        ticket.setUserName(request.getUserName());
        ticket.setUserEmail(request.getUserEmail());
        ticket.setUserPhone(request.getUserPhone());
        ticket.setCategory(request.getCategory());
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setStatus("OPEN");
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        ticket.setAppVersion(request.getAppVersion());
        ticket.setDeviceInfo(request.getDeviceInfo());
        ticket.setRideId(request.getRideId());

        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("✅ Ticket créé: {} - {}", savedTicket.getTicketNumber(), savedTicket.getSubject());

        return mapToResponse(savedTicket);
    }

    public List<TicketResponse> getUserTickets(Long userId, String status) {
        List<Ticket> tickets;
        if (status != null && !status.isEmpty()) {
            tickets = ticketRepository.findByUserIdAndStatus(userId, status);
        } else {
            tickets = ticketRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<TicketResponse> getAllTickets(String status, String priority,
                                              String category, Long assignedTo,
                                              Pageable pageable) {
        Page<Ticket> tickets;

        if (status != null && !status.isEmpty()) {
            tickets = ticketRepository.findByStatus(status, pageable);
        } else if (priority != null && !priority.isEmpty()) {
            tickets = ticketRepository.findByPriority(priority, pageable);
        } else if (assignedTo != null) {
            tickets = ticketRepository.findByAssignedTo(assignedTo, pageable);
        } else {
            tickets = ticketRepository.findAll(pageable);
        }

        return tickets.map(this::mapToResponse);
    }

    public TicketResponse getTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + id));
        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long id, TicketStatus status, String resolutionNote) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + id));

        // ✅ Convertir l'enum en String
        ticket.setStatus(status.name());

        if (status == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            log.info("✅ Ticket résolu: {}", ticket.getTicketNumber());
        }

        if (status == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
            log.info("🔒 Ticket fermé: {}", ticket.getTicketNumber());
        }

        Ticket updated = ticketRepository.save(ticket);
        return mapToResponse(updated);
    }

    @Transactional
    public TicketResponse assignTicket(Long id, Long agentId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + id));

        ticket.setAssignedTo(agentId);
        ticket.setStatus("IN_PROGRESS");

        Ticket updated = ticketRepository.save(ticket);
        log.info("👤 Ticket assigné à l'agent {}: {}", agentId, ticket.getTicketNumber());

        return mapToResponse(updated);
    }

    @Transactional
    public void rateTicket(Long id, Integer rating, String comment) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + id));

        ticket.setRating(rating);
        ticket.setRatingComment(comment);
        ticketRepository.save(ticket);

        log.info("⭐ Ticket noté: {} - {} étoiles", ticket.getTicketNumber(), rating);
    }

    // ============================================
    // MÉTHODES DE GESTION DES MESSAGES
    // ============================================

    @Transactional
    public MessageResponse addMessage(Long ticketId, MessageRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + ticketId));

        Message message = new Message();
        message.setTicketId(ticketId);
        message.setSenderId(request.getSenderId());
        message.setSenderType(request.getSenderType());
        message.setSenderName(request.getSenderName());
        message.setMessage(request.getMessage());
        message.setMessageType("TEXT");
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        log.info("💬 Message ajouté au ticket {}: {}", ticketId, savedMessage.getId());

        return mapToMessageResponse(savedMessage);
    }

    @Transactional
    public MessageResponse addVoiceMessage(Long ticketId, MultipartFile file,
                                           Integer duration, Long senderId,
                                           String senderType) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + ticketId));

        String fileUrl = "https://example.com/voice/" + System.currentTimeMillis() + ".mp3";

        Message message = new Message();
        message.setTicketId(ticketId);
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setMessageType("VOICE");
        message.setAttachmentUrl(fileUrl);
        message.setAttachmentName(file.getOriginalFilename());
        message.setDuration(duration);
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        log.info("🎤 Message vocal ajouté au ticket {}: {}s", ticketId, duration);

        return mapToMessageResponse(savedMessage);
    }

    @Transactional
    public MessageResponse addAttachment(Long ticketId, MultipartFile file,
                                         Long senderId, String senderType) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + ticketId));

        String fileUrl = "https://example.com/attachments/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();

        Message message = new Message();
        message.setTicketId(ticketId);
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setMessageType("FILE");
        message.setAttachmentUrl(fileUrl);
        message.setAttachmentName(file.getOriginalFilename());
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        log.info("📎 Pièce jointe ajoutée au ticket {}: {}", ticketId, file.getOriginalFilename());

        return mapToMessageResponse(savedMessage);
    }

    // ============================================
    // MÉTHODES WEB SOCKET
    // ============================================

    @Transactional
    public Message saveWebSocketMessage(ChatMessage chatMessage) {
        Message message = new Message();
        message.setTicketId(chatMessage.getTicketId());
        message.setSenderId(chatMessage.getSenderId());
        message.setSenderType(chatMessage.getSenderType());
        message.setSenderName(chatMessage.getSenderName());
        message.setMessage(chatMessage.getContent());
        message.setMessageType(chatMessage.getMessageType() != null ? chatMessage.getMessageType() : "TEXT");
        message.setAttachmentUrl(chatMessage.getAttachmentUrl());
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);

        Ticket ticket = ticketRepository.findById(chatMessage.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé: " + chatMessage.getTicketId()));
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        log.info("💬 Message WebSocket sauvegardé: Ticket {} - Message {}",
                chatMessage.getTicketId(), savedMessage.getId());

        return savedMessage;
    }

    @Transactional
    public void markMessageAsRead(Long messageId) {
        messageRepository.findById(messageId).ifPresent(message -> {
            message.setIsRead(true);
            message.setReadAt(LocalDateTime.now());
            messageRepository.save(message);
            log.info("👀 Message marqué comme lu: {}", messageId);
        });
    }

    @Transactional
    public void markMessagesAsRead(Long ticketId, Long userId) {
        List<Message> messages = messageRepository.findByTicketIdAndSenderIdNotAndIsReadFalse(
                ticketId, userId);

        if (!messages.isEmpty()) {
            messages.forEach(message -> {
                message.setIsRead(true);
                message.setReadAt(LocalDateTime.now());
            });
            messageRepository.saveAll(messages);
            log.info("👀 {} messages marqués comme lus pour ticket {} par utilisateur {}",
                    messages.size(), ticketId, userId);
        }
    }

    public List<MessageResponse> getTicketMessages(Long ticketId) {
        List<Message> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        return messages.stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    public Long getUnreadCount(Long ticketId, Long userId) {
        return messageRepository.countByTicketIdAndSenderIdNotAndIsReadFalse(ticketId, userId);
    }

    // ============================================
    // MÉTHODES DE STATISTIQUES
    // ============================================

    public SupportStats getStats() {
        SupportStats stats = new SupportStats();
        stats.setTotalTickets(ticketRepository.count());
        stats.setOpenTickets(ticketRepository.countByStatus("OPEN"));
        stats.setInProgressTickets(ticketRepository.countByStatus("IN_PROGRESS"));
        stats.setWaitingTickets(ticketRepository.countByStatus("WAITING"));
        stats.setResolvedTickets(ticketRepository.countByStatus("RESOLVED"));
        stats.setClosedTickets(ticketRepository.countByStatus("CLOSED"));

        Double avgRating = ticketRepository.getAverageRating();
        stats.setSatisfactionRate(avgRating != null ? (avgRating / 5.0) * 100 : 0.0);

        Double avgResponseTime = ticketRepository.getAverageResponseTime();
        stats.setAvgResponseTime(avgResponseTime != null ? avgResponseTime : 0.0);

        return stats;
    }

    public List<TicketResponse> getUrgentTickets() {
        List<Ticket> tickets = ticketRepository.findByPriorityAndStatus("URGENT", "OPEN");
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ============================================
    // MÉTHODES DE MAPPING
    // ============================================

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTicketNumber(ticket.getTicketNumber());
        response.setUserId(ticket.getUserId());
        response.setUserType(ticket.getUserType());
        response.setUserName(ticket.getUserName());
        response.setUserEmail(ticket.getUserEmail());
        response.setUserPhone(ticket.getUserPhone());
        response.setCategory(ticket.getCategory());
        response.setSubject(ticket.getSubject());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setAssignedTo(ticket.getAssignedTo());
        response.setRideId(ticket.getRideId());
        response.setAppVersion(ticket.getAppVersion());
        response.setDeviceInfo(ticket.getDeviceInfo());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolvedAt(ticket.getResolvedAt());
        response.setClosedAt(ticket.getClosedAt());
        response.setRating(ticket.getRating());
        response.setRatingComment(ticket.getRatingComment());

        List<Message> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        response.setMessages(messages.stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList()));

        return response;
    }

    private MessageResponse mapToMessageResponse(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setTicketId(message.getTicketId());
        response.setSenderId(message.getSenderId());
        response.setSenderType(message.getSenderType());
        response.setSenderName(message.getSenderName());
        response.setMessage(message.getMessage());
        response.setMessageType(message.getMessageType());
        response.setAttachmentUrl(message.getAttachmentUrl());
        response.setAttachmentName(message.getAttachmentName());
        response.setDuration(message.getDuration());
        response.setIsRead(message.getIsRead());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}