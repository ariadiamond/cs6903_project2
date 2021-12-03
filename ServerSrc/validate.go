package main

import (
	"regexp"
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
	if reId.Find([]byte(id)) != nil {
		return false
	}
	return true
}

// TODO Fix if cert does not start or end with -----... CERTIFICATE-----
// if cert[:len(beginCert)] != "-----BEGIN CERTIFICATE-----" and for end
func ValidateCert(cert string) bool {
	if reCert.Find([]byte(cert)) == nil {
		return false
	}
	return true
}

func ValidateNonce(nonce string) bool {
	if len(nonce) != (NONCE_SIZE >> 2) {
		return false
	}
	if reNonce.Find([]byte(nonce)) != nil {
		return false
	}
	return true
}

func ValidateToken(token string) bool {
	if len(token) != (TOKEN_SIZE >> 2) {
		return false
	}
	if reToken.Find([]byte(token)) != nil {
		return false
	}
	return true
}
