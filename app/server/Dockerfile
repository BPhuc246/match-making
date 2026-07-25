# syntax=docker/dockerfile:1.4
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /match-making

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

RUN chmod +x mvnw

RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline -B

COPY src src

RUN --mount=type=cache,target=/root/.m2 ./mvnw clean package -DskipTests -B -o

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /match-making/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]