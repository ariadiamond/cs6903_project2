package main

// Includes
import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"sync"
)

type createUserData struct {
	PublicKey string `json:"publicKey"`
}

type createUserResponse struct {
	Id           string `json:"id"`
	SessionToken string `json:"sessionToken"`
}

type storeSecretData struct{
	SessionToken  string `json:"sessionToken"`
	Iv            string `json:"iv"`
	EncryptedData string `json:"encryptedData"`
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
	Endpoint("/create", "")
	/* Verify Client input */
	if r.Method != http.MethodPost {
		w.WriteHeader(400)
		Debug("Hit /create without POST method")
		return
	}

	var data createUserData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		w.WriteHeader(400)
		Debug("Hit /create but unable to decode JSON: " + err.Error())
		return
	}

    // Validate certificate
    //if !ValidateCert(data.PublicKey) {
    //    w.WriteHeader(400)
    //    return
    //}

	/* Alright now we can start doing things */
	// lock new user mutex
	newUserMutex.Lock()
	defer newUserMutex.Unlock() // with a successful execution, this unlocks late

	// get a new cryptikID
	newByteID := make([]byte, ID_LEN >> 1)
	var newID string
	numRes := 1 // this needs to be outside of the for loop because we want to enter the loop

	for _, err := rand.Read(newByteID); numRes != 0; _, err = rand.Read(newByteID) {
		if err != nil { // unable to generate randomness
			w.WriteHeader(500)
			Debug("Unable to generate randomness for ID: " + err.Error())
			return
		}
		newID = hex.EncodeToString(newByteID)
		Debug("Created new ID: " + newID)
		// check if this ID has been used already
		rows, err := Jarvis.Query(`SELECT COUNT(*) FROM Users WHERE id = $1`, newID)
		if err != nil {
			w.WriteHeader(500)
			Debug("Unable to query Jarvis: " + err.Error())
			return
		}
		defer rows.Close()

		if !rows.Next() {
			w.WriteHeader(500)
			Debug("Unable to get number of users with ID")
			return
		}
		if rows.Scan(&numRes) != nil {
			w.WriteHeader(500)
			Debug("Unable to get number of users with ID")
			return
		}
		rows.Close()
	}

	if _, err := Jarvis.Exec(`INSERT INTO Users(id, pubKey) VALUES ($1, $2)`, newID, data.PublicKey);
		err != nil {
		// What do we do? just fail?
		w.WriteHeader(500)
		Debug("Unable to insert new user into Jarvis: " + err.Error())
		return
	}

	// Generate and add session token
	sessionToken, err := AddSession(newID)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to generate session token: " + err.Error())
		return
	}

	// Respond to Client
	response := createUserResponse{
		Id:           newID,
		SessionToken: sessionToken,
	}

	if err = json.NewEncoder(w).Encode(response); err != nil { // implicit 200
		w.WriteHeader(500)
		Debug("Unable to encode JSON response: " + err.Error())
		// implicit return
	}

}

/* StoreSecret alllows the user to store their file containing their secret values on the server.
 * This file is encrypted by deriving a key from the user's password. Since authentication is
 * provided by signing a nonce with the secret key of the pulic key pair, the server does not know
 * the user's password, meaning the secrets are safe and unable to be decrypted by the server (or an
 * intruder).
 */
func StoreSecret(w http.ResponseWriter, r *http.Request) {
	if (r.Method != http.MethodPost) {
		w.WriteHeader(400)
		Debug("Hit /store without POST method")
		return
	}

	var serverData storeSecretData
	if err := json.NewDecoder(r.Body).Decode(&serverData); err != nil {
		w.WriteHeader(400)
		Debug("Hit /store but unable to decode JSON: " + err.Error())
		return
	}

	// check if SessionToken is valid
    if !ValidateToken(serverData.SessionToken) {
        w.WriteHeader(400)
        Debug("Hit /store but provided invalid session token")
        return
    }

	id, exist := DereferenceToken(serverData.SessionToken)
	if !exist {
		w.WriteHeader(404)
		Debug("Hit /store but session token does not exist")
		return
	}
	Endpoint("/store", id)

	_, err := Jarvis.Exec(`UPDATE Users SET iv = $1 WHERE id = $2;`, serverData.Iv, id)
	if err != nil {
		w.WriteHeader(500)
		Debug("Unable to update Jarvis: " + err.Error())
		return
	}

	// io write encryptedData to file
	 if err = ioutil.WriteFile("UserKeys/" + id, []byte(serverData.EncryptedData), 0600);
	 	err != nil {
		 w.WriteHeader(500)
		 Debug("Unable to write " + id + "'s secret file: " + err.Error())
		 return
	 }

	w.WriteHeader(200)
}
