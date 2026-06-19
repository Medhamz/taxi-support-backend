package com.abdil.support.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private Long userId;
    private String userType;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String category;
    private String subject;
    private String description;
    private String status;
    private String priority;
    private Long assignedTo;
    private Long rideId;
    private String appVersion;
    private String deviceInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private Integer rating;
    private String ratingComment;
    private List<MessageResponse> messages;
}