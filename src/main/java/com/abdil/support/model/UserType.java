package com.abdil.support.model;

public enum UserType {
    CLIENT("Client"),
    DRIVER("Chauffeur"),
    AGENT("Agent Support");

    private final String label;

    UserType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}