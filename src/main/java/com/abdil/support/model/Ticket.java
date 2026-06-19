package com.abdil.support.model;  // ✅ Changé de com.taxi.support.model à com.abdil.support.model

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ticketNumber;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "user_type", nullable = false)
    private String userType;  // ✅ Changé de UserType à String

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_phone")
    private String userPhone;

    @Column(name = "category", nullable = false)
    private String category;  // ✅ Changé de Category à String

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "status")
    private String status = "OPEN";  // ✅ Changé de TicketStatus à String

    @Column(name = "priority")
    private String priority = "MEDIUM";  // ✅ Changé de TicketPriority à String

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "ride_id")
    private Long rideId;

    @Column(name = "app_version")
    private String appVersion;

    @Column(name = "device_info")
    private String deviceInfo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "rating_comment")
    private String ratingComment;

    @PrePersist
    public void prePersist() {
        if (ticketNumber == null) {
            ticketNumber = generateTicketNumber();
        }
    }

    private String generateTicketNumber() {
        return "TCK-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000);
    }
}