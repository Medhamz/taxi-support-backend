# Dockerfile - Version corrigée
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copier les fichiers
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
COPY pom.xml .

# Copier les sources
COPY src src

# Construire l'application avec un nom de fichier fixe
RUN ./mvnw clean package -DskipTests

# Définir le nom du JAR (assurez-vous qu'il correspond au vrai nom)
RUN mv target/*.jar target/app.jar

# Exposer le port
EXPOSE 8082

# Démarrer l'application
CMD ["java", "-jar", "target/app.jar"]