FROM golang:alpine AS builder

COPY ./ /data

WORKDIR /data
RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN go build

FROM alpine:latest

COPY --from=builder /data/l4d2-manager /

ENTRYPOINT ["/l4d2-manager"]