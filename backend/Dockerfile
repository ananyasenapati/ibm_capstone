# =============================================================
# Multi-stage Dockerfile for the eBookStore Spring Boot backend
# Build context = backend/ (Dockerfile lives alongside pom.xml)
# Render, Fly.io, or any Docker host:
#   docker build -t ebookstore -f backend/Dockerfile backend/  # from repo root
#   docker run -p 8080:8080 ebookstore
# =============================================================
# ---- Stage 1: Maven build ----
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy POM first to leverage Docker layer caching
COPY pom.xml .
COPY src ./src

# Build the JAR (skip tests for faster builds; tests still run in CI)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -DskipTests clean package

# ---- Stage 2: Runtime (small, JRE-only) ----
FROM eclipse-temurin:17-jre-alpine

# Create a non-root user for security
RUN addgroup -S app && adduser -S -G app app
USER app

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder --chown=app:app /build/target/ebookstore-1.0.0.jar app.jar

# Render sets $PORT at runtime; Spring reads SERVER_PORT from application.properties
# Override with the -D flag so we honor Render's dynamic port assignment
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
