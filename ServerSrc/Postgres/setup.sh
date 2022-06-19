#!/bin/bash

cp server.crt ${PGDATA}/server.crt
cp server.key ${PGDATA}/server.key

chown postgres ${PGDATA}/server.key
chmod 0600 ${PGDATA}/server.key

mv postgresql.conf ${PGDATA}/postgresql.conf

pg_ctl reload
