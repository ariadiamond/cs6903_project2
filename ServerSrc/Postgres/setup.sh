#!/bin/bash

mv server.crt ${PGDATA}/server.crt
mv server.key ${PGDATA}/server.key

chown postgres ${PGDATA}/server.key
chmod 0600 ${PGDATA}/server.key

mv postgresql.conf ${PGDATA}/postgresql.conf

pg_ctl reload
