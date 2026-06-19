package com.abdil.support.model;

public enum TicketStatus {
    OPEN("Ouvert"),
    IN_PROGRESS("En cours"),
    WAITING("En attente"),
    RESOLVED("Résolu"),
    CLOSED("Fermé");

    private final String label;

    TicketStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TicketStatus fromString(String status) {
        for (TicketStatus s : TicketStatus.values()) {
            if (s.name().equalsIgnoreCase(status)) {
                return s;
            }
        }
        return OPEN;
    }
}