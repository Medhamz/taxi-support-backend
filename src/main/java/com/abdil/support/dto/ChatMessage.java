package com.abdil.support.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private Long id;
    private Long ticketId;
    private Long senderId;
    private String senderType; // USER ou AGENT
    private String senderName;
    private String content;
    private String messageType; // TEXT, VOICE, IMAGE
    private String attachmentUrl;
    private Long timestamp;
    private Boolean isRead;
}