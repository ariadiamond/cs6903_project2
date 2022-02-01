package main

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"net/http"
	"strings"
	"sync"
)

type newChatData struct {
	Token     string   `json:"sessionToken"`
	Members   []string `json:"members"`
	G         string   `json:"g"`
	P         string   `json:"p"`
	Exps      []string `json:"exponents"`
	Signature string   `json:"signature"`
}

type newChatResponse struct {
	Channel int `json:"channel"`
}

type acceptData struct {
	Token     string   `json:"sessionToken"`
	Channel   int      `json:"channel"`
	Accept    bool     `json:"accept"`
	Exps      []string `json:"exponents"`
	Signature string   `json:"signature"`
}

type findData struct {
	Token string `json:"sessionToken"`
}

type findResponse struct {
	Channel int      `json:"channel"`
	Members []string `json:"members"`
	G       string   `json:"g"`
	P       string   `json:"p"`
	Exps    []string `json:"exponents"`
	Signature string `json:"signature"`
}

const (
	MAX_MEMBERS = 10
)

var (
	MAX_CHANNEL = big.NewInt(1 << 16)
	newChatMutex sync.Mutex
)


/* NewChat initializes a chat with the members specified. In order to have end-to-end encryption
 * (in which the server is not an end) using symmetric keys, all users must accept and generate a
 * secret for generation of the symmetric key. This just creates the server side state and places a
 * notification for the users of the group chat to accept or decline the next time they are active.
 *
 * The server side state is currently undefined, but this could be a SQL table (if we decide to
 * store data that way), or just a special message on the user's SQL table.
 *
 * The client needs to send their session cookie along with the request.
 *
 * An explanation of Diffie Hellman
 * g, prime: p, secret: x
 * send you -> g, p, g^x mod p
 * secret: y
 * send me -> g^y mod p
 * you compute g^x^y mod p
 * I compute g^y^x mod p
 
 */
func NewChat(w http.ResponseWriter, r *http.Request) {
	/* Check validity */
	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		Debug("Hit /newChat without POST method")
		return
	}
	
	var clientData newChatData
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /newChat but unable to decode JSON: " + err.Error())
		return
	}
	
	id, exist := DereferenceToken(clientData.Token)
	if !exist {
		w.WriteHeader(403)
		Debug("Hit /newChat but session token does not exist")
		return
	}
	Endpoint("/newChat", id)
	
	for _, val := range(clientData.Members) {
		if !ValidateId(val) {
			w.WriteHeader(400)
			Debug("Invalid ID in chat members")
			return
		}
	}

	if (id != clientData.Members[0]) || (len(clientData.Members) > MAX_MEMBERS) {
		w.WriteHeader(400)
		Debug("Client not in chat or too many members")
		return
	}

	/* We have validated input, so let's do things */
	// Generate a new channel ID
	newChatMutex.Lock()
	defer newChatMutex.Unlock()

	var channelBI *big.Int
	var err error
	numRes := 1
	for channelBI, err = rand.Int(rand.Reader, MAX_CHANNEL); numRes != 0;
		channelBI, err = rand.Int(rand.Reader, MAX_CHANNEL) {
		if err != nil {
			w.WriteHeader(500)
			Debug("Unable to genereate channel ID: " + err.Error())
			return
		}
		rows, err := Jarvis.Query(`SELECT COUNT(*) FROM Channels WHERE channel = $1`,
		    channelBI.Int64())
		if err != nil {
			w.WriteHeader(500)
			Debug("Unable to query Jarvis for channel IDs: " + err.Error())
			return
		}
		defer rows.Close()

		if !rows.Next() {
			w.WriteHeader(500)
			Debug("Unable to get channel")
			return
		}
		if err = rows.Scan(&numRes); err != nil {
			w.WriteHeader(500)
			Debug("Unable to get channel: " + err.Error())
		}
	}
	channel := channelBI.Int64()

	// Insert new data
	_, err = Jarvis.Exec(`INSERT INTO Channels VALUES ($1, $2, $3, $4, $5, $6, $7)`, channel,
		strings.Join(clientData.Members, ","), clientData.Members[1], clientData.G, clientData.P,
		strings.Join(clientData.Exps, ","), clientData.Signature)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to insert new channel into Jarvis: " + err.Error())
		return
	}
	// :)
	response := newChatResponse {
		int(channel),
	}

	if err = json.NewEncoder(w).Encode(response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}
}

/* AcceptChat is a user's response to joining a chat. If they deny, the chat cannot be created,
 * meaning all users must accept the chat for it to be created, and for anyone to send messages in
 * it. If they accept, the client generates a secret (not shared with the server), and does O(m)
 * exponentiations where m is the number of people in the chat. These exponentiations are shared
 * with the server, as they are part of Diffie Hellman key agreement, so this information does not
 * leak information.
 */
func AcceptChat(w http.ResponseWriter, r *http.Request) {
	/* Validate client input */
	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		Debug("Hit /acceptChat without POST method")
		return
	}
	
	var clientData acceptData
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /acceptChat but unable to decode JSON: " + err.Error())
		return
	}
	// get an ID from the sessionToken
	id, exist := DereferenceToken(clientData.Token)
	if !exist {
		w.WriteHeader(403)
		Debug("Hit /acceptChat but session token does not exist")
		return
	}
	Endpoint("/acceptChat", id)
	
	/* get channel information, so we can do a little more validation */
	rows, err := Jarvis.Query(`SELECT members FROM Channels WHERE channel = $1`, clientData.Channel)
	if err != nil || !rows.Next() {
		w.WriteHeader(404)
		Debug("Unable to query Jarvis for members: " + err.Error())
		return
	}
	defer rows.Close()
	
	var memberResponse string
	if err = rows.Scan(&memberResponse); err != nil {
		w.WriteHeader(400)
		Debug("Unable to get members: " + err.Error())
		return
	}
	
	members := strings.Split(memberResponse, ",")
	var next string
	for idx, val := range(members) {
		if val == id {
			next = members[(idx + 1) % len(members)]
			break
		}
	}
	if next == "" {
		w.WriteHeader(403)
		Debug("Client not in channel")
		return
	}
	
	/* We did our validation, now let's do things! */
	if clientData.Accept {
		var exps string
		if len(clientData.Exps) == 0 {
			next = "NULL"
			exps = "NULL"
		} else {
			exps = strings.Join(clientData.Exps, ",")
			next = next
		}

        if _, err := Jarvis.Exec(`UPDATE Channels SET next = $1, exps = $2, signature = $3 WHERE channel = $4`,
			next, exps, clientData.Signature, clientData.Channel); err != nil {
			w.WriteHeader(500)
			Debug("Unable to update exponents in Jarvis: " + err.Error())
			return
		}
	} else { // the client didn't want to joing the chat, so it no longer exists
		if _, err := Jarvis.Exec(`DELETE FROM Channels WHERE channel = $1`, clientData.Channel);
			err != nil {
			w.WriteHeader(500)
			Debug("Unable to remove channel from Jarvis: " + err.Error())
			return
		}
	}
	// :)
	w.WriteHeader(200)
}


/* FindChats checks the server for any chats that the client is being waited on to set up.
 *
 */
func FindChat(w http.ResponseWriter, r *http.Request) {
	/* Validate client input */
	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		Debug("Hit /findChat without POST method")
		return
	}
	
	var clientData findData
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /findChat but unable to decode JSON: " + err.Error())
		return
	}
	
	id, exist := DereferenceToken(clientData.Token)
	if !exist {
		w.WriteHeader(403)
		Debug("Hit /findChat but session token does not exist")
		return
	}
	Endpoint("/findChat", id)
	
	/* We've validated client input , so now let's do things */
	rows, err := Jarvis.Query(`SELECT channel, members, g, p, exps, signature FROM Channels WHERE next = $1`,
		id)
	if err != nil {
		w.WriteHeader(400)
		Debug("Unable to get chats from Jarvis: " + err.Error())
		return
	}
	defer rows.Close()
	
	if !rows.Next() { // there are no new chats to act on
		_, err := w.Write([]byte("[]")) // implicit 200
		if err != nil {
			w.WriteHeader(500)
			Debug("Unable to write empty chat")
		}
		return
	}
	
	response := make([]findResponse, 0)
	var chat findResponse
	// because SQL is first order, it does not support arrays so we have to convert them here
	var members string
	var exps string
	amt := 0
	for err = rows.Scan(&chat.Channel, &members, &chat.G, &chat.P, &exps, &chat.Signature);
		true;
		err = rows.Scan(&chat.Channel, &members, &chat.G, &chat.P, &exps, &chat.Signature) {
		amt += 1
		if err != nil {
			w.WriteHeader(500)
			Debug("Unable to scan for next chat: " + err.Error())
			return
		}
		Debug(chat.Signature)
		chat.Members = strings.Split(members, ",")
		chat.Exps = strings.Split(exps, ",")
		response = append(response, chat)
		if !rows.Next() {
			break
		}
	}
	
	if err = json.NewEncoder(w).Encode(response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}
}
