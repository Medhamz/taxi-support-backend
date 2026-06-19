package com.abdil.support.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private Long id;
    private Long ticketId;
    private Long senderId;
    private String senderType;
    private String senderName;
    private String message;
    private String messageType;
    private String attachmentUrl;
    private String attachmentName;
    private Integer duration;
    private Boolean isRead;
    private LocalDateTime createdAt;
}