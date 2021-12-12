FROM postgres:14.1

# Because I am nice to people who use Windows
# escape=`

# Set up 
WORKDIR /docker

# Set environment variables
ENV POSTGRES_PASSWORD=unused
# ENV PGDATA=/var/lib/postgresql/data # implicit

# Copy key pair into container
COPY server.crt    .
COPY server.key    .
COPY postgresql.conf .

# Copy in initialization scripts
COPY setup.sql /docker-entrypoint-initdb.d/setup.sql
COPY setup.sh  /docker-entrypoint-initdb.d/setup.sh

# Expose default port number for postgres
EXPOSE 5432

# Run command
CMD ["postgres"]
