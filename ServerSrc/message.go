package main

// Includes
import (
	"net/http"
	"strings"
)

type SendMessageData struct {
	messageSent	string `json:"messageSent"`
	sessionToken string `json:"sessionToken"`
	channel	int `json:"channel"`
}

/* NewChat initializes a chat with the members specified. In order to have end-to-end encryption
 * (in which the server is not an end) using symmetric keys, all users must accept and generate a
 * secret for generation of the symmetric key. This just creates the server side state and places a
 * notification for the users of the group chat to accept or decline the next time they are active.
 *
 * The server side state is currently undefined, but this could be a SQL table (if we decide to
 * store data that way), or just a special message on the user's SQL table.
 *
 * The client needs to send their session cookie along with the request.
 */
func NewChat(w http.ResponseWriter, r *http.Request) {}

/* AcceptChat is a user's response to joining a chat. If they deny, the chat cannot be created,
 * meaning all users must accept the chat for it to be created, and for anyone to send messages in
 * it. If they accept, the client generates a secret (not shared with the server), but does O(m)
 * exponentiations where m is the number of people in the chat. These exponentiations are shared
 * with the server, as they are part of Diffie Hellman Key Agreement, so this information does not
 * leak information.
 */
func AcceptChat(w http.ResponseWriter, r *http.Request) {}

/* SendMessage sends messages to chats that have been initialized (someone has called NewChat and
 * the remaining people have accepted the chat). On the serverside, the server just inserts a new
 * row into the corresponding table(s) with the message sent. Certain information (such as who sent
 * and who is recieving the message are leaked), but the message itself is encrypted with a key
 * unknown to the server.
 *
 * The client needs to send their session cookie along with the request.
 */
func SendMessage(w http.ResponseWriter, r *http.Request) {

	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if (r.Method != http.MethodPost) {
		w.WriteHeader(400)
		return
	}

	// Decode message sent to server
	var serverData SendMessageData
	if err := json.NewDecoder(r.Body).Decode(&serverData); err != nil {
		w.WriteHeader(400)
		return
	}

	// Parse data and error check
	id, exist := DereferenceToken(serverData.sessionToken)
	if !exist {
		w.WriteHeader(404)
		return
	}

 // Query database for active memebers in channel to verify
	rows, err := Jarvis.Query(`SELECT members FROM channels WHERE channel = ? AND next = NULL;`, serverData.channel)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	if !rows.Next() {
		w.WriteHeader(404)
		return
	}

	// Checking to verify members with associated ID are present in chat
	var members string

	if rows.Scan(&members) != nil {
		w.WriteHeader(404)
		return
	}

	if strings.Index(members, id) == -1 {
		w.WriteHeader(403)
		return
	}


	// Insert new row into table with message sent
	_, err := Jarvis.Exec(`INSERT INTO messages (channel, message) VALUES ($1, $2)`, serverData.channel, serverData.messageSent)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	w.WriteHeader(200) // :)

}

/* GetMessages queries the server for any new messages that have yet to be recieved by the client.
 * Depending on implementation, this could require queries to one or more SQL tables.
 *
 * The client needs to send their session cookie along with the request.
 */
func GetMessages(w http.ResponseWriter, r *http.Request) {}
