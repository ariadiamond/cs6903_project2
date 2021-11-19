package main

// Includes
import (
	"crypto/rand"
	"encoding/json"
	"crypto/ed25519"
	"net/http"
	"io/ioutil"
	"time"
)

cont (
	NONCE_SIZE = 128 >> 3// 2^128 of random values
	KEY_SIZE = 4096 >> 3 // 4096 bits of keys
)

type authStep1Data struct {
	id string `json:"id"`
}

type authStep1Response struct {
	nonce string `json:"nonce"`
	file []byte `json:"encryptedFile"`
}

type NonceHolder struct{
	nonce string
	expireTime Time
}

type authStep2Data struct {
	signature string `json:"signature"`
	id string `json:"id"`
}

type authStep2Response struct {
	sessionToken string `json:"sessionToken"`
}


/* AuthStep1 is for users who have already created an account and want to log in. The user sends
 * their CryptikID as identification, and the server returns a nonce as a challenge. The server
 * stores the nonce for use in AuthStep2 (this is the only short term state that needs to be
 * maintained server-side during communication).
 */
func AuthStep1(w http.ResponseWriter, r *http.Request) {
	if (r.Method != http.MethodPost){
		goto BadRequest
	}

	var clientData authStep1Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		goto BadRequest
	}

	if file, err:= os.Open("UserKeys/" + id); err != nil{
		goto NotFound
	}

	encryptedData, err := ioutil.ReadAll("UserKeys/" + id); err != nil {
		goto BadRequest
	}

	nonce := make([]byte, NONCE_SIZE)
		if _, err := rand.Read(nonce){
			goto InternalError
		}

	NonceHolderMap[id] := NonceHolder {
		nonce: nonce,
		expireTime: time.Now()
	}

		response := authStep1Response{
			nonce: nonce,
			file: encryptedData
		}

		w.WriteHeader(200)
		if err:= json.NewEncoder(w).Encode(&response); err != nil {
			goto InternalError
		}
		return


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
func AuthStep2(w http.ResponseWriter, r *http.Request) {

	if (r.Method != http.MethodPost){
		goto BadRequest
	}

	var clientData authStep2Data
	if err := json.NewDecoder(r.Body).Decode(&clientData); err != nil {
		goto BadRequest
	}

	if rows, err := jarvis.Query(`SELECT pubKey FROM Users WHERE id = ?`, clientData.id); err != nil {
		goto NotFound
	}

	if ! rows.Next() {
		goto NotFound
	}

	pubKey := make([]byte, ed25519.PublicKeySize)

	if err := rows.Scan(&pubKey); err != nil {
		goto NotFound
	}

	if nonce, exists := NonceHolderMap[clientData.id]; !exists {
		goto NotFound
	}

	if ! ed25619.Verify(pubKey, nonce, clientData.signature) {
		goto ForbiddenError
	}

	sessionToken := make([]byte, NONCE_SIZE)
		if _, err := rand.Read(sessionToken){
			goto InternalError
		}

	sessionTokenMap[sessionToken] = clientData.id

	response := authStep2Response{
		sessionToken:  sessionToken
	}

	w.WriteHeader(200)
	if err:= json.NewEncoder(w).Encode(&response); err != nil {
		goto InternalError
	}
	return


	BadRequest:
		w.WriteHeader(400)
		return
	ForbiddenError:
		w.WriteHeader(403)
		return
	NotFound:
		w.WriteHeader(404)
		return
}


/* GetPublicKey
 *
 */
func GetPublicKey(w http.ResponseWriter, r *http.Request) {}
