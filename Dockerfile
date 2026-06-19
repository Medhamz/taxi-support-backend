# Dockerfile - Version avec Eclipse Temurin
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copier les fichiers du projet
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