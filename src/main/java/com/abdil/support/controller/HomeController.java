package com.abdil.support.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
public class HomeController {

    @Value("${spring.application.name:Taxi Support API}")
    private String appName;

    @Value("${server.port:8082}")
    private String port;

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("appName", appName);
        model.addAttribute("port", port);
        model.addAttribute("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        model.addAttribute("status", "✅ Application démarrée avec succès !");
        return "index";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }
}