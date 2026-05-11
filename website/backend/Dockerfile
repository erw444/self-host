# Build Stage
FROM golang:1.16-alpine as builder

WORKDIR /app
COPY main.go .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main main.go

# Run Stage
FROM scratch
COPY --from=builder /app/main /main
EXPOSE 8000
ENTRYPOINT ["/main"]