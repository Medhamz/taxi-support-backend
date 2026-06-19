package com.abdil.support.model;

public enum TicketPriority {
    LOW("Basse"),
    MEDIUM("Moyenne"),
    HIGH("Élevée"),
    URGENT("Urgente");

    private final String label;

    TicketPriority(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TicketPriority fromString(String priority) {
        for (TicketPriority p : TicketPriority.values()) {
            if (p.name().equalsIgnoreCase(priority)) {
                return p;
            }
        }
        return MEDIUM;
    }
}