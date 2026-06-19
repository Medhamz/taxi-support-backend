# Dockerfile
FROM openjdk:17-jdk-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier Maven wrapper
COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .

# Copier les sources
COPY src src

# Rendre le wrapper exécutable
RUN chmod +x mvnw

# Construire l'application
RUN ./mvnw clean package -DskipTests

# Exposer le port
EXPOSE 8082

# Lancer l'application
CMD ["java", "-jar", "target/*.jar"]