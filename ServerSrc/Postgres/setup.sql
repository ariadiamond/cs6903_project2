/* Sets up PostgreSQL database with the tables we need for the Cryptik server to interact with. */

CREATE TABLE Users (
	id     CHAR(4)  PRIMARY KEY,
	iv     CHAR(16),
	pubKey CHAR(48) NOT NULL -- 32 bytes of data in base64
);

CREATE TABLE Channels (
	channel   INTEGER      PRIMARY KEY,
	members   VARCHAR(50)  NOT NULL,
	next      CHAR(4)      REFERENCES Users(id), -- this can be NULL if the channel is ready
	g         BIT(2048)    NOT NULL,
	p         BIT(2048)    NOT NULL,
	exps      VARCHAR(2000),
    signature CHAR(128) -- signature size is 64 bytes, but 128 in hex
);

-- Create a sequence to do autoincrement to create a unique key for each message (as required by
-- SQL). This assumes no more than 2^31 messages will be sent.
-- https://www.postgresql.org/docs/14/datatype-numeric.html
CREATE TABLE Messages (
	Autoinc   SERIAL4   PRIMARY KEY,
	channel   INTEGER   NOT NULL    REFERENCES Channels(channel),
	iv        CHAR(16),
	message   VARCHAR(2048) NOT NULL,
	signature CHAR(128)
);
