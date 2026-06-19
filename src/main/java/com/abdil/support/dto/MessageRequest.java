package com.abdil.support.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;  // ✅ Changé de javax à jakarta
import jakarta.validation.constraints.NotNull;  // ✅ Changé de javax à jakarta

@Data
public class MessageRequest {

    @NotNull(message = "L'ID de l'expéditeur est requis")
    private Long senderId;

    @NotBlank(message = "Le type d'expéditeur est requis")
    private String senderType; // USER ou AGENT

    private String senderName;
    private String message;
    private String messageType; // TEXT, VOICE, IMAGE, FILE
}