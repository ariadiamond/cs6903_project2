package main

// Includes
import (
	"net/http"
	"strconv"
)

func main() {
	// Parse Command Line Options
	
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
		srv.ListenAndServe()
	} else {
		srv.ListenAndServeTLS("ServerSrc/cert.pem", "ServerSrc/key.pem")
	}
}