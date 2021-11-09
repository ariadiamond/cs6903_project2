package main

// Includes
import (
    "net/http"
)

/* CreateUser is reached when a user wants to create their account. This does not require the user
 * to send any data with their request, but returns a new Cryptik ID and special session cookie to
 * allow them to set their password.
 */
func CreateUser(w http.ResponseWriter, r *http.Request) {}

/* SetPassword allows a user to reset their password. Currently this is only reachable directly
 * the user hit the /create endpoint as it requires a special session cookie to reset (to prevent
 * others from reseting a user's password). The user specifies their password, and the server hashes
 * and stores it. The user also creates a public/private key pair, (ideally with the private key
 * derived from the password). The public key is then shared with the server so that others can
 * verify messages sent from the user.
 */
func SetPassword(w http.ResponseWriter, r *http.Request) {}