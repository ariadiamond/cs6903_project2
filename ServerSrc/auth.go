package main

// Includes
import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"io/ioutil"
	"net/http"
)

type authStep1Data struct {
	Id string `json:"id"`
}

type authStep1Response struct {
	Nonce string `json:"nonce"`
	Iv    string `json:"iv"`
	File  string `json:"encryptedFile"`
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
		Debug("Hit auth/1 without POST method")
		return
	}

	// Try to decode the ID they want
	var clientData authStep1Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		w.WriteHeader(400)
		Debug("Hit auth/1, but unable to decode JSON")
		return
	}

	// check ID is valid
	if !ValidateId(clientData.Id) {
		w.WriteHeader(400)
		Debug("Hit auth/1, but has invalid ID")
		return
	}
	
	// We have enough data to print endpoint logging
	Endpoint("/auth/1", clientData.Id)

	/* We did our checks, we can now try to do things */
	// Open user secret file
	encryptedData, err := ioutil.ReadFile("UserKeys/" + clientData.Id)
	if err != nil {
		w.WriteHeader(404)
		Debug("Unable to open " + clientData.Id + "'s secret file: " + err.Error())
		return
	}

	// generate nonce
	nonce, err := AddNonce(clientData.Id)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to generate nonce: " + err.Error())
		return
	}
	
	// get IV for user's secret file
	rows, err := Jarvis.Query(`SELECT iv FROM Users WHERE id = $1`, clientData.Id)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to query Jarvis: " + err.Error())
		return
	}
	defer rows.Close()
	if !rows.Next() {
		w.WriteHeader(500)
		Debug("Unable to get iv from Jarvis")
		return
	}
	var iv string
	if err = rows.Scan(&iv); err != nil {
		w.WriteHeader(500)
		Debug("Unable to get iv from Jarvis: " + err.Error())
		return
	}

	// send back response
	response := authStep1Response{
		Nonce: nonce,
		Iv:    iv,
		File:  string(encryptedData),
	}

	if err = json.NewEncoder(w).Encode(&response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Error encoding and sending JSON response: " + err.Error())
		// implicit return
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
		Debug("Hit auth/2 without POST method")
		return
	}

	var clientData authStep2Data
	if json.NewDecoder(r.Body).Decode(&clientData) != nil {
		w.WriteHeader(400)
		Debug("Hit auth/2, but unable to decode JSON")
		return
	}

	if !ValidateId(clientData.Id) {
		w.WriteHeader(400)
		Debug("Hit auth/2, but provided invalid ID")
		return
	}
	Endpoint("auth/2", clientData.Id)

	/* After validating input, lets validate their signature */
	// get public key from Jarvis
	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = $1`, clientData.Id)
	if err != nil {
		w.WriteHeader(404)
		Debug("Unable to query for public key: " + err.Error())
		return
	}
	defer rows.Close()

	if !rows.Next() {
		w.WriteHeader(404)
		Debug("Unable to get public key from Jarvis")
		return
	}

	pubKeyB64 := make([]byte, ed25519.PublicKeySize << 1)
	if err = rows.Scan(&pubKeyB64); err != nil {
		w.WriteHeader(404)
		Debug("Unable to get public key from Jarvis: " + err.Error())
		return
	}
	
	Info(string(pubKeyB64))
	pubKey := make([]byte, ed25519.PublicKeySize)
	// convert base64 public key (stored method) to binary
	_, err = base64.StdEncoding.Decode(pubKey, pubKeyB64[:44])
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to decode base64: " + err.Error())
		return
	}
	nonce, exists := GetNonce(clientData.Id)
	if !exists {
		w.WriteHeader(404)
		Debug("Unable to retrieve nonce for " + clientData.Id)
		return
	}

	Info(nonce)
	Info(string(clientData.Signature))
	if !ed25519.Verify(pubKey, []byte(nonce), clientData.Signature) {
		w.WriteHeader(403)
		Debug("Invalid signature for authentication")
		return
	}

	sessionToken, err := AddSession(clientData.Id)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to generate session token: " + err.Error())
		return
	}

	response := authStep2Response{
		SessionToken: sessionToken,
	}

	if err = json.NewEncoder(w).Encode(&response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}
}


/* GetPublicKey
 *
 */
func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	Endpoint("/getpk/", r.URL.Path[len("/getpk/"):])
	/* Start with checks to make sure the client data is valid. */
	// Check for the correct HTTP method
	if r.Method != http.MethodGet {
		w.WriteHeader(400)
		Debug("Hit getpk without GET method")
		return
	}

	id := r.URL.Path[len("/getpk/"):]
	if !ValidateId(id) {
		w.WriteHeader(400)
		Debug("Invalid Id for getpk")
		return
	}

	rows, err := Jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?;`, id)
	if err != nil {
		w.WriteHeader(404)
		Debug("Query error for getting public key")
		return
	}
	defer rows.Close()

	if !rows.Next() {
		w.WriteHeader(404)
		Debug("Unable to get public key")
		return
	}

	var responseData getPublicKeyResponse
	if err = rows.Scan(&responseData.PubKey); err != nil {
		w.WriteHeader(404)
		Debug("Unable to get public key: " + err.Error())
		return
	}

	if err = json.NewEncoder(w).Encode(responseData); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}
}
