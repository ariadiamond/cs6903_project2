package main

// Includes
import (
	"net/http"
	"strings"
	"encoding/json"
	"time"
)

type sendMessageData struct {
	SessionToken string `json:"sessionToken"`
	Channel	     int    `json:"channel"`
	MessageSent	 string `json:"message"`
}

type getMessagesData struct{
	SessionToken  string    `json:"sessionToken"`
	UserTimestamp time.Time `json:"userTimestamp"`
}

type getMessagesResponse struct {
	Messages []string `json:"messages"`
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
		Debug("Hit /send without POST method")
		return
	}

	// Decode message sent to server
	var serverData sendMessageData
	if err := json.NewDecoder(r.Body).Decode(&serverData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /send but unable to decode JSON: " + err.Error())
		return
	}

	// Parse data and error check
	id, exist := DereferenceToken(serverData.SessionToken)
	if !exist {
		w.WriteHeader(404)
		Debug("Hit /send but could not find session token")
		return
	}
	Endpoint("/send", id)

 // Query database for active memebers in channel to verify
	rows, err := Jarvis.Query(`SELECT members FROM channels WHERE channel = ? AND next = NULL;`,
		serverData.Channel)
	if err != nil {
		w.WriteHeader(404)
		Debug("Unable to query Jarvis: " + err.Error())
		return
	}
	defer rows.Close()

	if !rows.Next() {
		w.WriteHeader(404)
		Debug("Unable to get members in channel")
		return
	}

	// Checking to verify members with associated ID are present in chat
	var members string

	if err = rows.Scan(&members); err != nil {
		w.WriteHeader(404)
		Debug("Unable to get members in channel: " + err.Error())
		return
	}

	if !strings.Contains(members, id) {
		w.WriteHeader(403)
		Debug("User not in channel")
		return
	}


	// Insert new row into table with message sent
	_, err = Jarvis.Exec(`INSERT INTO messages (channel, message) VALUES ($1, $2);`,
		serverData.Channel, serverData.MessageSent)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to insert message into Jarvis: " + err.Error())
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
		Debug("Hit /retrieve without POST method")
		return
	}

	//
	var serverData getMessagesData
	if err := json.NewDecoder(r.Body).Decode(&serverData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /retrieve but unable to decode JSON: " + err.Error())
		return
	}

	// Parse data and error check
	id, exist := DereferenceToken(serverData.SessionToken)
	if !exist {
		w.WriteHeader(404)
		Debug("Hit /retrieve but session token does not exist")
		return
	}
	Endpoint("/retrieve", id)

	// Query database for any messages not yet recieved
 	rows, err := Jarvis.Query(`SELECT message FROM messages WHERE channel in (SELECT channel FROM channels WHERE members LIKE $1) AND messageTimestamp > $2;`,
 		id, serverData.UserTimestamp)
 	if err != nil {
 		w.WriteHeader(404)
 		Debug("Unable to query Jarvis for messages: " + err.Error())
 		return
 	}
 	defer rows.Close()
 	
 	if !rows.Next() {
 		w.WriteHeader(404)
 		Debug("Unable to get messages")
 		return
 	}

	var message string
	var response getMessagesResponse

	// Iterate through returned messages
	for ; rows.Next(); err = rows.Scan(&message) {
		if err != nil {
			// >:(
			w.WriteHeader(400)
			Debug("Unable to go to next message: " + err.Error())
			return
		}
		response.Messages = append(response.Messages, message)
	}

 	// Return messages
	if err = json.NewEncoder(w).Encode(response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}
}
