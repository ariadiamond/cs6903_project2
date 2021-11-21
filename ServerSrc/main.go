package main

// Includes
import (
	"log"
	"net/http"
	"strconv"
	"database/sql"
)

var Jarvis *sql.DB

func setGlobals() {
	NonceHolderMap  = make(map[string]NonceHolder)
	SessionTokenMap = make(map[string]string)
	
}

func main() {
	// Parse Command Line Options
	port := 8080
	insecure := false
	DEBUG := false

	setGlobals()
	// Create a server variable so we can do clean shutdowns
	srv := http.Server{ Addr: ":" + strconv.Itoa(port) }
	
	// Register Handlers (using default serve mux)
	// register.go
	http.HandleFunc("/create", CreateUser)
	// auth.go
	http.HandleFunc("/auth/1", AuthStep1)
	http.HandleFunc("/auth/2", AuthStep2)
	http.HandleFunc("/getpk/", GetPublicKey)
	// message.go
	http.HandleFunc("/newChat", NewChat)
	http.HandleFunc("/send", SendMessage)
	http.HandleFunc("/retrieve", GetMessages)
	
	// Run server
	// If DEBUG set, allow for HTTP (instead of HTTPS)
	if DEBUG && insecure {
		log.Fatal(srv.ListenAndServe())
	} else {
		log.Fatal(srv.ListenAndServeTLS("ServerSrc/cert.pem", "ServerSrc/key.pem"))
	}
}