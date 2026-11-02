# Testes não rodam aqui: os de integração precisam do Docker (ver specs/005-contas-e-servidor/plan.md)
FROM maven:3.9.16-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests

FROM eclipse-temurin:21.0.13_9-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/habits-api.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
