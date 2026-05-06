#Build stage
FROM golang:1.20-alpine AS builder

WORKDIR /app
COPY server.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server server.go

#Final stage
FROM scratch

COPY --from=builder /app/server /server
COPY static /static

EXPOSE 8080
ENTRYPOINT ["/server"]