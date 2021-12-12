package main

import (
	"regexp"
	"strings"
)

// create regular expressions as global (to file) variables so we do not have to reinitialize them
// each call
var (
	reId = regexp.MustCompile(`[^0-9a-fA-F]`)
	reCert = regexp.MustCompile(`(-----BEGIN CERTIFICATE-----\n)([0-9a-zA-Z/+=\n]*)(\n-----END CERTIFICATE-----)`)
	reNonce = regexp.MustCompile(`[^0-9a-fA-F]`)
	reToken = regexp.MustCompile(`[^0-9a-fA-F]`)
)

/* ValidateId checks that the ID is correctly formatted, not that it exists. Essentially this checks
 * the length of the string and ensures all 4 characters are hex. This returns true if the ID is
 * valid, and false if not.
 */
func ValidateId(id string) bool {
	if len(id) != ID_LEN {
		return false
	}
	return reId.Find([]byte(id)) == nil
}

func ValidateCert(cert string) bool {
	if !strings.HasPrefix(cert, "-----BEGIN CERTIFICATE-----") {
		return false
	}
	if !strings.HasSuffix(cert, "-----END CERTIFICATE-----") {
		return false
	}
	return reCert.Find([]byte(cert)) != nil
}

func ValidateNonce(nonce string) bool {
	if len(nonce) != (NONCE_SIZE >> 2) {
		return false
	}
	return reNonce.Find([]byte(nonce)) == nil
}

func ValidateToken(token string) bool {
	if len(token) != (TOKEN_SIZE >> 2) {
		return false
	}
	return reToken.Find([]byte(token)) == nil
}
