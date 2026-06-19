package com.abdil.support.dto;

import lombok.Data;

@Data
public class TypingIndicator {
    private Long ticketId;
    private Long userId;
    private String userName;
    private Boolean isTyping;
}