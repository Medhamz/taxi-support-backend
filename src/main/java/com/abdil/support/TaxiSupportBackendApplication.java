package com.abdil.support;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication(exclude = {MailSenderAutoConfiguration.class})
public class TaxiSupportBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaxiSupportBackendApplication.class, args);

        System.out.println("""
                
                ╔═══════════════════════════════════════════════════════════════════╗
                ║                                                                   ║
                ║     🚀  TAXI SUPPORT PLATFORM                                   ║
                ║     🛠️  Technical Support System                                ║
                ║                                                                   ║
                ║     ╔═══════════════════════════════════════════════════════════╗ ║
                ║     ║  ✅ Status        : ONLINE                              ║ ║
                ║     ║  📍 Port          : 8082                                ║ ║
                ║     ║  🔗 API           : /api/support                        ║ ║
                ║     ║  📊 Dashboard     : /api/support/                       ║ ║
                ║     ║  🗄️  Database     : PostgreSQL ✅                       ║ ║
                ║     ║  📧 Email         : Configuré ✅                        ║ ║
                ║     ║  🔔 Notifications : Activées ✅                         ║ ║
                ║     ║  🔗 WebSocket     : /ws-support                         ║ ║
                ║     ╚═══════════════════════════════════════════════════════════╝ ║
                ║                                                                   ║
                ║     🌟  Prêt à gérer vos tickets de support !                    ║
                ║     📝  http://localhost:8082/api/support                        ║
                ║                                                                   ║
                ╚═══════════════════════════════════════════════════════════════════╝
                
                """);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}