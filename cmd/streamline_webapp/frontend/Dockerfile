# Build backend
FROM golang:1.22 AS backend
WORKDIR /app
COPY ./backend .
RUN go build -o server .

# Build frontend
FROM node:20 AS frontend
WORKDIR /app
COPY ./frontend .
RUN npm install && npm run build

# Final image
FROM alpine:latest
WORKDIR /app
COPY --from=backend /app/server .
COPY --from=frontend /app/dist ./frontend
EXPOSE 8080
CMD ["./server"]
