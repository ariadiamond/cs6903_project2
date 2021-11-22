package main

// Includes
import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"
)

const (
	NONCE_SIZE = 128  >> 3 // 2^128 of random values
)

var NonceHolderMap  map[string]NonceHolder
var SessionTokenMap map[string](string)

type authStep1Data struct {
	id string `json:"id"`
}

type authStep1Response struct {
	nonce []byte `json:"nonce"`
	file  []byte `json:"encryptedFile"`
}

type NonceHolder struct {
	nonce      []byte
	expireTime time.Time
}

type authStep2Data struct {
	id        string `json:"id"`
	signature []byte `json:"signature"`
}

type authStep2Response struct {
	sessionToken []byte `json:"sessionToken"`
}

type GetPublicKeyData struct {
	id				string `json:"id"`
}

type GetPublicKeyResponse struct {
	pubKey		[ed25519.PublicKeySize]byte `json:"pubKey"`
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
		w.WriteHeader(400)
		return
	}

	// Try to decode the ID they want
	var clientData authStep1Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		return
	}

	// TODO check ID is valid

	/* We did our checks, we can now try to do things */
	// Open user secret file
	encryptedData, err := ioutil.ReadFile("UserKeys/" + clientData.id)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	// generate nonce
	nonce := make([]byte, NONCE_SIZE)
	if _, err := rand.Read(nonce); err != nil {
		w.WriteHeader(500)
		return
	}
	NonceHolderMap[clientData.id] = NonceHolder{
		nonce:      nonce,
		expireTime: time.Now(),
	}

	// send back response
	response := authStep1Response{
		nonce: nonce,
		file:  encryptedData,
	}

	w.WriteHeader(200) // :)
	if err:= json.NewEncoder(w).Encode(&response); err != nil {
		w.WriteHeader(500) // TODO will this superfluous 500?
		return
	}
}

/* AuthStep2 verifies that the password is correct. The user presents a hash of their hashed
 * password concatenated with the challenge nonce. This allows for both the server to verify the
 * client's password without needing to send it over the wire. If the password is correct (the
 * server has the same hash and saved the nonce, so can do the same computation), the server sets a
 * session cookie keep the user logged in. The server stores the cookie with a reference to the
 * user's CryptikID for future operations.
 * SELECT hash FROM Users WHERE userID = cryptikID;
 */
func AuthStep2(w http.ResponseWriter, r *http.Request) {

	if (r.Method != http.MethodPost){
		w.WriteHeader(400)
		return
	}

	var clientData authStep2Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		return
	}

	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?;`, clientData.id)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	if !rows.Next() {
		w.WriteHeader(404)
		return
	}

	pubKey := make([]byte, ed25519.PublicKeySize)

	if err := rows.Scan(&pubKey); err != nil {
		w.WriteHeader(404)
		return
	}

	nonce, exists := NonceHolderMap[clientData.id];
	if !exists {
		w.WriteHeader(404)
		return
	}

	if !ed25519.Verify(pubKey, nonce.nonce, clientData.signature) {
		w.WriteHeader(403)
		return
	}

	sessionToken := make([]byte, NONCE_SIZE)
	if _, err := rand.Read(sessionToken); err != nil {
		w.WriteHeader(500)
		return
	}

	SessionTokenMap[string(sessionToken)] = clientData.id

	response := authStep2Response{
		sessionToken: sessionToken,
	}

	w.WriteHeader(200)
	if err:= json.NewEncoder(w).Encode(&response); err != nil {
		w.WriteHeader(500)
		return
	}
}


/* GetPublicKey
 *
 */
func GetPublicKey(w http.ResponseWriter, r *http.Request) {

	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if (r.Method != http.MethodPost){
		w.WriteHeader(400)
		return
	}

	var clientData GetPublicKeyData
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		return
	}

	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?;`, clientData.id)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	if !rows.Next() {
		w.WriteHeader(404)
		return
	}

	var responseData GetPublicKeyResponse

	if err := rows.Scan(&responseData.pubKey); err != nil {
		w.WriteHeader(404)
		return
	}

	w.WriteHeader(200)
	if err:= json.NewEncoder(w).Encode(&responseData.pubKey); err != nil {
		w.WriteHeader(500)
		return
	}
}
