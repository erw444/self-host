# Build Stage
FROM golang:1.21-alpine as builder

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# Run Stage
FROM scratch
COPY --from=builder /app/main /main
EXPOSE 8000
ENTRYPOINT ["/main"]