FROM postgres:14.1

# Because I am nice to people who use Windows
# escape=`

# Set environment variables
ENV POSTGRES_PASSWORD= # TODO set password here!
ENV PGDATA=/var/lib/postgresql/data # This is the default, but is set so we can copy config file

# Copy configuation file into container
COPY postgresql.conf ${PGDATA}/postgresql.conf

# Expose default port number for postgres
EXPOSE 5432

# Run command
CMD ["postgres"]