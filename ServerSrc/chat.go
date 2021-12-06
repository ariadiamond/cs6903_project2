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
	token     string   `json:"sessionToken"`
	members   []string `json:"members"`
	g         big.Int  `json:"g"`
	p         big.Int  `json:"p"`
	exps      []string `json:"exponents"`
	signature string   `json:"signature"`
}

type newChatResponse struct {
	channel int `json:"channel"`
}

type acceptData struct {
	token     string   `json:"sessionToken"`
	channel   int      `json:"channel"`
	accept    bool     `json:"accept"`
	exps      []string `json:"exponents"`
	signature string   `json:"signature"`
}

type findData struct {
	token string `json:"sessionToken"`
}

type findResponse struct {
	channel int      `json:"channel"`
	members []string `json:"members"`
	g       big.Int  `json:"g"`
	p       big.Int  `json:"p"`
	exps    []string `json:"exponents"`
	signature string `json:"signature"`
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
		return
	}
	
	var clientData newChatData
	if json.NewDecoder(r.Body).Decode(&clientData) != nil {
		w.WriteHeader(400)
		return
	}
	
	id, exist := DereferenceToken(clientData.token)
	if !exist {
		w.WriteHeader(403)
		return
	}
	
	for _, val := range(clientData.members) {
		if !ValidateId(val) {
			w.WriteHeader(400)
			return
		}
	}
	if (id != clientData.members[0]) || (len(clientData.members) > MAX_MEMBERS) {
		w.WriteHeader(400)
		return
	}
	
	/* We have validated input, so let's do things */
	
	// Generate a new channel ID
	newChatMutex.Lock()
	defer newChatMutex.Unlock()
	
	var channelBI *big.Int
	numRes := 1
	for channelBI, err := rand.Int(rand.Reader, MAX_CHANNEL); numRes != 0;
		channelBI, err = rand.Int(rand.Reader, MAX_CHANNEL) {
		if err != nil {
			w.WriteHeader(500)
			return
		}
		rows, err := Jarvis.Query(`SELECT COUNT(*) FROM Channels WHERE channel = ?;`, channelBI)
		defer rows.Close()
		if err != nil {
			w.WriteHeader(500)
			return	
		}
		if !rows.Next() {
			w.WriteHeader(500)
			return
		}
		if rows.Scan(&numRes) != nil {
			w.WriteHeader(500)
		}
	}
	channel := channelBI.Uint64()
	
	// Insert new data
	stmt, err := Jarvis.Prepare(`INSERT INTO Channels(channel, members, next, g, p, exps) VALUES ($1, $2, $3, $4, $5, $6);`)
	_, err = stmt.Exec(channel, strings.Join(clientData.members, ","),
		clientData.members[1], clientData.g, clientData.p, clientData.exps)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	// :)
	w.WriteHeader(200)
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
		return
	}
	
	var clientData acceptData
	if json.NewDecoder(r.Body).Decode(&clientData) != nil {
		w.WriteHeader(400)
		return
	}
	// get an ID from the sessionToken
	id, exist := DereferenceToken(clientData.token)
	if !exist {
		w.WriteHeader(403)
		return
	}
	
	/* get channel information, so we can do a little more validation */
	rows, err := Jarvis.Query(`SELECT members FROM Channels WHERE channel = ?;`, id)
	defer rows.Close()
	if err != nil || !rows.Next() {
		w.WriteHeader(404)
		return
	}
	
	var memberResponse string
	if rows.Scan(&memberResponse) != nil {
		w.WriteHeader(400)
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
		return
	}
	
	/* We did our validation, now let's do things! */
	if clientData.accept {
		var exps string
		if len(clientData.exps) == 0 {
			next = "NULL"
			exps = "NULL"
		} else {
			exps = "'" + strings.Join(clientData.exps, ",") + "'"
			next = "'" + next + "'"
		}
		
		if _, err := Jarvis.Exec(`UPDATE Channels SET next = $1, exps = $2, signature = $3 WHERE channel = $4;`,
			next, exps, clientData.signature, clientData.channel); err != nil {
			w.WriteHeader(500)
			return
		}
	} else { // the client didn't want to joing the chat, so it no longer exists
		if _, err := Jarvis.Exec(`DELETE FROM Channels WHERE channel = ?;`, clientData.channel);
			err != nil {
			w.WriteHeader(500)
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
		return
	}
	
	var clientData findData
	if json.NewDecoder(r.Body).Decode(&clientData) != nil {
		w.WriteHeader(400)
		return
	}
	
	id, exist := DereferenceToken(clientData.token)
	if !exist {
		w.WriteHeader(403)
		return
	}
	rows, err := Jarvis.Query(`SELECT channel, members, g, p, exps, signature FROM Channels WHERE next = ?;`,
		id)
	defer rows.Close()
	if err != nil {
		w.WriteHeader(400)
		return
	}
	
	if !rows.Next() { // there are no new chats to act on
		w.Write([]byte("[]")) // implicit 200
		return
	}
	
	response := make([]findResponse, 0)
	var chat findResponse
	for err = rows.Scan(&chat.channel, &chat.members, &chat.g, &chat.p, &chat.exps, &chat.signature);
		rows.Next();
		err = rows.Scan(&chat.channel, &chat.members, &chat.g, &chat.p, &chat.exps, &chat.signature) {
		if err != nil {
			w.WriteHeader(500)
			return
		}
		response = append(response, chat)
	}
	
	if json.NewEncoder(w).Encode(response) != nil { // implicit 200
		w.WriteHeader(500)
		// implicit return
	}
}
