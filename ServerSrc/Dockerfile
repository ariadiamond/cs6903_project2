# OS we are starting from 
FROM golang:1.17.3-alpine 

# Set the Current Working Directory 
WORKDIR /docker

# Copy our go files into the container
COPY *.go   .
COPY go.mod .
COPY go.sum .

# Copy in key/cert
COPY *.pem  .

# Build our executable 
RUN go build

# Exposes port 4443 
EXPOSE 4443

# Run our server ;3
CMD ["./Cryptik"]
