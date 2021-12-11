package main

// Includes
import (
	"crypto/ed25519"
	"encoding/json"
	"io/ioutil"
	"net/http"
)

type authStep1Data struct {
	Id string `json:"id"`
}

type authStep1Response struct {
	Nonce string `json:"nonce"`
	File  []byte `json:"encryptedFile"`
}

type authStep2Data struct {
	Id        string `json:"id"`
	Signature []byte `json:"signature"`
}

type authStep2Response struct {
	SessionToken string `json:"sessionToken"`
}

type getPublicKeyResponse struct {
	PubKey [ed25519.PublicKeySize]byte `json:"pubKey"`
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

	// check ID is valid
    if !ValidateId(clientData.Id) {
        w.WriteHeader(400)
        return
    }

	/* We did our checks, we can now try to do things */
	// Open user secret file
	encryptedData, err := ioutil.ReadFile("UserKeys/" + clientData.Id)
	if err != nil {
		w.WriteHeader(404)
		return
	}

	// generate nonce
	nonce, err := AddNonce(clientData.Id)
	if err != nil {
		w.WriteHeader(500)
		return
	}

	// send back response
	response := authStep1Response{
		Nonce: nonce,
		File:  encryptedData,
	}

	if  json.NewEncoder(w).Encode(&response) != nil { // implicit 200
		w.WriteHeader(500)
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

	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		return
	}

	var clientData authStep2Data
	if json.NewDecoder(r.Body).Decode(&clientData) != nil {
		w.WriteHeader(400)
		return
	}

	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?;`, clientData.Id)
	if err != nil {
		w.WriteHeader(404)
		return
	}
	defer rows.Close()

	if !rows.Next() {
		w.WriteHeader(404)
		return
	}

	pubKey := make([]byte, ed25519.PublicKeySize)

	if rows.Scan(&pubKey) != nil {
		w.WriteHeader(404)
		return
	}

	nonce, exists := GetNonce(clientData.Id)
	if !exists {
		w.WriteHeader(404)
		return
	}

	if !ed25519.Verify(pubKey, []byte(nonce), clientData.Signature) {
		w.WriteHeader(403)
		return
	}

	sessionToken, err := AddSession(clientData.Id)
	if err != nil {
		w.WriteHeader(500)
		return
	}

	response := authStep2Response{
		SessionToken: sessionToken,
	}

	if json.NewEncoder(w).Encode(&response) != nil { // implicit 200
		w.WriteHeader(500)
		// implicit return
	}
}


/* GetPublicKey
 *
 */
func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if r.Method != http.MethodGet {
		w.WriteHeader(400)
		return
	}

	id := r.URL.Path[len("/getpk/"):]
	if !ValidateId(id) {
		w.WriteHeader(400)
		return
	}

	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?;`, id)
	if err != nil {
		w.WriteHeader(404)
		return
	}
	defer rows.Close()

	if !rows.Next() {
		w.WriteHeader(404)
		return
	}

	var responseData getPublicKeyResponse
	if rows.Scan(&responseData.PubKey) != nil {
		w.WriteHeader(404)
		return
	}

	if json.NewEncoder(w).Encode(responseData) != nil { // implicit 200
		w.WriteHeader(500)
		// implicit return
	}
}
