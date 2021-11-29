package main

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

type Token_t struct {
	id      string
	created time.Time
}
type Nonce_t struct {
	nonce   string
	created time.Time
}

const (
	NONCE_SIZE = 128
	TOKEN_SIZE = 128 // 2^128 of random values

//	NONCE_EXPIRATION = 
//	TOKEN_EXPIRATION = 
)

var (
	NonceHolder   = make(map[string]Nonce_t) // TODO convert to sync.Map
	SessionHolder = make(map[string]Token_t) // TODO convert to sync.Map
)

/* AddSession generates a session token and adds it to the map, associating it with the it provided.
 * It also returns the token to the caller.
 */
func AddSession(id string) (string, error) {
	token := make([]byte, TOKEN_SIZE >> 3)
	if _, err := rand.Read(token); err != nil {
		return "", err
	}
	hexToken := hex.EncodeToString(token)
	
	tokenData := Token_t{
		id:      id,
		created: time.Now(),
	}
	SessionHolder[hexToken] = tokenData
	
	return hexToken, nil
}

/* RemoveToken periodically iterates through tokens and removes expired ones.
 *
 */
func RemoveToken() {

//	for ;; /* time.Sleep() */ { // infinite loop
		
//	}
}

/* AddNonce generates a nonce and stores it in the NonceHolder map, returing the nonce to the
 * calling function. If a nonce cannot be generated, an error is returned.
 */
func AddNonce(id string) (string, error) {
	nonce := make([]byte, NONCE_SIZE >> 3)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	nonceHex := hex.EncodeToString(nonce)
	
	nonceHolder := Nonce_t{
		nonce:   nonceHex,
		created: time.Now(),
	}
	
	NonceHolder[id] = nonceHolder
	
	return nonceHex, nil
}

func GetNonce(id string) (string, bool) {
	nonce, exist := NonceHolder[id]
	if !exist {
		return "", false
	}
	// check that nonce has not expired
	return nonce.nonce, true
}
