package main

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

type Token_t struct {
	Id      string
	Created time.Time
}
type Nonce_t struct {
	Nonce   string
	Created time.Time
}

const (
	NONCE_SIZE = 128
	TOKEN_SIZE = 128 // 2^128 of random values

	NONCE_EXPIRATION = time.Minute
	TOKEN_EXPIRATION = time.Hour * 24 // 1 day
)

var (
	NonceHolder   = make(map[string]Nonce_t)
	SessionHolder = make(map[string]Token_t)
	nonceLock   sync.RWMutex
	sessionLock sync.RWMutex
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
		Id:      id,
		Created: time.Now(),
	}
	
	sessionLock.Lock()
	SessionHolder[hexToken] = tokenData
	sessionLock.Unlock()
	
	return hexToken, nil
}

/* RemoveToken periodically iterates through tokens and removes expired ones.
 *
 */
func RemoveToken() {

	// Infinite  loop, checks every hour
	for ;; time.Sleep(time.Hour) {
		// Iterate through Nonces to check if any have expired
		nonceLock.Lock()
		for key, value := range(NonceHolder) {
			if time.Now().After(value.Created.Add(NONCE_EXPIRATION)) {
				delete(NonceHolder, key)
			}
		}
		nonceLock.Unlock()

		// Iterate through the Session Tokens to check if any have expired
		sessionLock.Lock()
		for key, value := range(SessionHolder) {
			if time.Now().After(value.Created.Add(TOKEN_EXPIRATION)) {
				delete(SessionHolder, key)
			}
		}
		sessionLock.Unlock()
	} // end external for
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
		Nonce:   nonceHex,
		Created: time.Now(),
	}

	nonceLock.Lock()
	NonceHolder[id] = nonceHolder
	nonceLock.Unlock()

	return nonceHex, nil
}

func GetNonce(id string) (string, bool) {
	if !ValidateId(id) {
		return "", false
	}
	
	nonceLock.RLock()
	defer nonceLock.RUnlock()
	nonce, exist := NonceHolder[id]
	if !exist {
		return "", false
	}
	// Check that nonce has not expired
	if time.Now().After(nonce.Created.Add(NONCE_EXPIRATION)) {
			return "", false
		}
	return nonce.Nonce, true
}

func DereferenceToken(token string) (string, bool) {
	if !ValidateToken(token) {
		return "", false
	}
	
	sessionLock.RLock()
	defer sessionLock.RUnlock()
	id, exist := SessionHolder[token]
	if !exist {
		return "", false
	}
	// Check that session Token has not expired
	if time.Now().After(id.Created.Add(TOKEN_EXPIRATION)) {
		return "", false
		}
	return id.Id, true
}
