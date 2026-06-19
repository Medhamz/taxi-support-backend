package com.abdil.support.controller;

import com.abdil.support.dto.*;
import com.abdil.support.model.TicketStatus;
import com.abdil.support.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketRequest request) {
        return ResponseEntity.ok(ticketService.createTicket(request));
    }

    @GetMapping("/tickets/user/{userId}")
    public ResponseEntity<List<TicketResponse>> getUserTickets(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ticketService.getUserTickets(userId, status));
    }

    @GetMapping("/tickets")
    public ResponseEntity<Page<TicketResponse>> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long assignedTo,
            Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(status, priority, category, assignedTo, pageable));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicket(id));
    }

    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<MessageResponse> addMessage(
            @PathVariable Long ticketId,
            @Valid @RequestBody MessageRequest request) {
        return ResponseEntity.ok(ticketService.addMessage(ticketId, request));
    }

    @PostMapping("/tickets/{ticketId}/voice")
    public ResponseEntity<MessageResponse> addVoiceMessage(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("duration") Integer duration,
            @RequestParam("senderId") Long senderId,
            @RequestParam("senderType") String senderType) {
        return ResponseEntity.ok(ticketService.addVoiceMessage(ticketId, file, duration, senderId, senderType));
    }

    @PostMapping("/tickets/{ticketId}/attachments")
    public ResponseEntity<MessageResponse> addAttachment(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("senderId") Long senderId,
            @RequestParam("senderType") String senderType) {
        return ResponseEntity.ok(ticketService.addAttachment(ticketId, file, senderId, senderType));
    }

    @PatchMapping("/tickets/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable Long id,
            @RequestParam TicketStatus status,
            @RequestParam(required = false) String resolutionNote) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, status, resolutionNote));
    }

    @PatchMapping("/tickets/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long id,
            @RequestParam Long agentId) {
        return ResponseEntity.ok(ticketService.assignTicket(id, agentId));
    }

    @PostMapping("/tickets/{id}/rate")
    public ResponseEntity<Void> rateTicket(
            @PathVariable Long id,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment) {
        ticketService.rateTicket(id, rating, comment);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<SupportStats> getStats() {
        return ResponseEntity.ok(ticketService.getStats());
    }

    @GetMapping("/tickets/urgent")
    public ResponseEntity<List<TicketResponse>> getUrgentTickets() {
        return ResponseEntity.ok(ticketService.getUrgentTickets());
    }
}