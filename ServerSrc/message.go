package main

// Includes
import (
	"net/http"
	"strings"
	"encoding/json"
	"time"
)

type SendMessageData struct {
	messageSent	string `json:"messageSent"`
	sessionToken string `json:"sessionToken"`
	channel	int `json:"channel"`
}

type GetMessagesData struct{
	sessionToken string `json:"sessionToken"`
	userTimestamp time.Time `json:"userTimestamp"`
}

type GetMessagesResponse struct {
	messages []string `json:"messages"`
}

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
	defer rows.Close()

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

	if !strings.Contains(members, id) {
		w.WriteHeader(403)
		return
	}


	// Insert new row into table with message sent
	_, err = Jarvis.Exec(`INSERT INTO messages (channel, message) VALUES ($1, $2)`, serverData.channel, serverData.messageSent)
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
func GetMessages(w http.ResponseWriter, r *http.Request) {

	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if (r.Method != http.MethodPost) {
		w.WriteHeader(400)
		return
	}

	//
	var serverData GetMessagesData
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

	// Query database for any messages not yet recieved
 	rows, err := Jarvis.Query(`SELECT message FROM messages WHERE channel in (SELECT channel FROM channels WHERE members LIKE $1) AND messageTimestamp > $2`, id, serverData.userTimestamp)
 	if err != nil {
 		w.WriteHeader(404)
 		return
 	}
 	defer rows.Close()
 	
 	if !rows.Next() {
 		w.WriteHeader(404)
 		return
 	}

	var message string

	var response GetMessagesResponse

	// Iterate through returned messages
	for ; rows.Next(); err = rows.Scan(&message) {
		if err != nil {
			// >:(
			w.WriteHeader(400)
			return
		}
		response.messages = append(response.messages, message)
	}

 	// Return messages 
	w.WriteHeader(200)
	if err:= json.NewEncoder(w).Encode(response); err != nil {
		w.WriteHeader(500)
		return
	}
}
