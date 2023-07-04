FROM golang:alpine AS builder

COPY ./ /data

WORKDIR /data
RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN go build

FROM docker:20.10.24-cli-alpine3.17

EXPOSE 27020

COPY --from=builder /data/l4d2-manager /
COPY ./static /static

ENTRYPOINT ["/l4d2-manager"]