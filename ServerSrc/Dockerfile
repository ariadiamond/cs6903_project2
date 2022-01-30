# OS we are starting from 
FROM golang:1.17.3-alpine 

# Set the Current Working Directory 
WORKDIR /docker

# Copy our go files into the container
COPY ServerSrc/*.go   .
COPY ServerSrc/go.mod .
COPY ServerSrc/go.sum .

# Copy in html files to serve up
COPY Visual/ ./Visual
COPY JavaScript/ ./JavaScript

# Copy in key/cert
COPY ServerSrc/*.pem  .

# Make directory for encrypted user files
RUN mkdir UserKeys

# Build our executable 
RUN go build

# Exposes port 4443 
EXPOSE 4443

# Run our server ;3
CMD ["./Cryptik", "-host", "10.10.0.2"]
