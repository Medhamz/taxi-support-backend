package com.abdil.support.dto;

import lombok.Data;

@Data
public class ReadReceipt {
    private Long ticketId;
    private Long userId;
    private String userName;
    private Long messageId;
    private Long timestamp;
}