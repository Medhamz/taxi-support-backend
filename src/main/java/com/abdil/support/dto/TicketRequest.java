package com.abdil.support.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class TicketRequest {

    @NotNull(message = "L'ID utilisateur est requis")
    private Long userId;

    @NotBlank(message = "Le type d'utilisateur est requis")
    private String userType; // CLIENT ou DRIVER

    private String userName;  // ✅ AJOUTÉ - Nom de l'utilisateur

    private String userEmail;
    private String userPhone;

    @NotBlank(message = "La catégorie est requise")
    private String category;

    @NotBlank(message = "Le sujet est requis")
    private String subject;

    private String description;
    private String priority;
    private String appVersion;
    private String deviceInfo;
    private Long rideId;
}