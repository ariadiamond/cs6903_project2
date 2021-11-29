/* Sets up PostgreSQL database with the tables we need for the Cryptik server to interact with. */

CREATE TABLE Users (
	id     CHAR(4) PRIMARY KEY,
	pubKey CHAR(48) NOT NULL -- 32 bytes of data in base64
);

CREATE TABLE Channels (
	channel INTEGER PRIMARY KEY,
	members VARCHAR() NOT NULL, -- TODO how many max people in a chat?
	next    CHAR(4)   REFERENCES Users(id), -- this can be NULL if the channel has been initialized
	g       CHAR(192)    NOT NULL, -- base64 of 2048
	p       CHAR(192)    NOT NULL, -- base64 of 2048
	exps    VARCHAR()
);

-- Create a sequence to do autoincrement to create a unique key for each message (as required by
-- SQL). This assumes no more than 2^31 messages will be sent.
-- https://www.postgresql.org/docs/14/datatype-numeric.html
CREATE SEQUENCE Message_Autoinc_seq AS INTEGER;
CREATE TABLE Messages (
	Autoinc SERIAL4   PRIMARY KEY DEFAULT nextval('Message_Autoinc_seq'),
	channel INTEGER   NOT NULL    REFERENCES Channels(channel),
	message VARCHAR() NOT NULL,
);
