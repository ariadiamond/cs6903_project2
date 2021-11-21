package main

// Includes
import (
	"crypto/rand"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"
)

const (
	NONCE_SIZE = 128 >> 3 // bytes of randomness which is 2^128 different nonce values
)

type authStep1Data struct {
	id string `json:"id"`
}

type authStep1Response struct {
	nonce string `json:"nonce"`
	file  []byte `json:"encryptedFile"`
}

type NonceHolder struct {
	nonce      string
	expireTime Time
}

/* AuthStep1 is for users who have already created an account and want to log in. The user sends
 * their CryptikID as identification, and the server returns a nonce as a challenge. The server
 * stores the nonce for use in AuthStep2 (this is the only short term state that needs to be
 * maintained server-side during communication).
 */
func AuthStep1(w http.ResponseWriter, r *http.Request) {
	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if (r.Method != http.MethodPost) {
		goto BadRequest
	}
	
	// Try to decode the ID they want
	var clientData authStep1Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		goto BadRequest
	}
	// TODO check ID is valid
	
	/* We did our checks, we can now try to do things */
	
	// Open user secret file
	if encryptedData, err := ioutil.ReadAll("UserKeys/" + clientData.id); err != nil {
		goto NotFound
	}
	
	// generate nonce
	nonce := make([]byte, NONCE_SIZE)
	if _, err := rand.Read(nonce); err != nil {
		goto InternalError
	}
	NonceHolderMap[clientData.id] = NonceHolder{
		nonce:      nonce,
		expireTime: time.Now()
	}
	
	// send back response
	response := authStep1Resonse{
		nonce: nonce,
		file:  encryptedData
	}
	
	w.WriteHeader(200) // :)
	if err:= json.NewEncoder(w).Encode(&response); err != nil {
		goto InternalError
	}
	return

	/* Here lies the bad children who had malformed requests */
BadRequest:
	w.WriteHeader(400)
	return
NotFound:
	w.WriteHeader(404)
	return
InternalError:
	w.WriteHeader(500)
	return
}

/* AuthStep2 verifies that the password is correct. The user presents a hash of their hashed
 * password concatenated with the challenge nonce. This allows for both the server to verify the
 * client's password without needing to send it over the wire. If the password is correct (the
 * server has the same hash and saved the nonce, so can do the same computation), the server sets a
 * session cookie keep the user logged in. The server stores the cookie with a reference to the
 * user's CryptikID for future operations.
 * SELECT hash FROM Users WHERE userID = cryptikID;
 */
func AuthStep2(w http.ResponseWriter, r *http.Request) {}

/* GetPublicKey
 *
 */
func GetPublicKey(w http.ResponseWriter, r *http.Request) {}
 