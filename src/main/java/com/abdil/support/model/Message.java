package com.abdil.support.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_messages")
@Data
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_type", nullable = false)
    private String senderType;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "message_type")
    private String messageType = "TEXT";

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}