package main

// Includes
import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"sync"
)

type createUserData struct {
	publicKey string `json:"publicKey"`
}

type createUserResponse struct {
	id           string `json:"id"`
	sessionToken string `json:"sesssionToken"`
}

const (
	ID_LEN = 4
)

var (
	newUserMutex sync.Mutex
)

/* CreateUser is reached when a user wants to create their account. The user sends their public key,
 * which the server stores and generates a Cryptik ID for the user. They also send a session token
 * to allow the user to be logged in and start chats and send messages.
 */
func CreateUser(w http.ResponseWriter, r *http.Request) {
	/* Verify Client input */
	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		return
	}
	
	var data createUserData
	if json.NewDecoder(r.Body).Decode(&data) != nil {
		w.WriteHeader(400)
		return
	}

    // Validate certificate
    if !ValidateCert(data.publicKey) {
        w.WriteHeader(400)
        return
    }

	/* Alright now we can start doing things */
	// lock new user mutex
	newUserMutex.Lock()
	// get a new cryptikID
	newByteID := make([]byte, ID_LEN >> 1)
	var newID string
	numRes := 1 // this needs to be outside of the for loop because we want to enter the loop
	
	for _, err := rand.Read(newByteID); numRes != 0; _, err = rand.Read(newByteID) {
		if err != nil { // unable to generate randomness
			w.WriteHeader(500)
			return
		}
		newID := hex.EncodeToString(newByteID)
		// check if this ID has been used already
		rows, err := Jarvis.Query(`SELECT COUNT(*) FROM Users WHERE id = ?`, newID)
		if err != nil {
			// what do we do?
		}
		if !rows.Next() {
			// how did this happen?
		}
		if rows.Scan(&numRes) != nil {
			// error
		}
		rows.Close()
	}
	
	if _, err := Jarvis.Exec(`INSERT INTO Users VALUES ($1, $2);`, newID, data.publicKey);
		err != nil {
		// What do we do? just fail?
		w.WriteHeader(500)
		return
	}
	
	// unlock new user mutex
	newUserMutex.Unlock()
	
	// Generate and add session token
	sessionToken, err := AddSession(newID)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	
	// Respond to Client
	response := createUserResponse{
		id:           newID,
		sessionToken: sessionToken,
	}
	w.WriteHeader(200)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		w.WriteHeader(500)
		return
	}

}

/* StoreSecret alllows the user to store their file containing their secret values on the server.
 * This file is encrypted by deriving a key from the user's password. Since authentication is
 * provided by signing a nonce with the secret key of the pulic key pair, the server does not know
 * the user's password, meaning the secrets are safe and unable to be decrypted by the server (or an
 * intruder).
 */
func StoreSecret(w http.ResponseWriter, r *http.Request) {

}
