package main

// Includes
import (
	"database/sql"
	"flag"
	_ "github.com/lib/pq"
	"net/http"
	"strconv"
	"os"
)

var Jarvis *sql.DB

// Command Line Arugments
var (
	port     = flag.Int("port", 4443, "Port to run HTTP Server on")
	insecure = flag.Bool("i", false, "Run over HTTP instead of HTTPS. This also requires the " +
		"DEBUG variable to be set")
	debug    = false
)

func connectToDB() {
	connStr := "user=postgres dbname=postgres password=unused"
	Jarvis, err := sql.Open("postgres", connStr)
	if err != nil {
		Fatal(err.Error(), 1)
	}
	if err = Jarvis.Ping(); err != nil {
		Fatal(err.Error(), 1)
	}
}

func main() {
	// Parse Command Line Options
	flag.Parse()
	if os.Getenv("DEBUG") == "DEBUG" {
		debug = true
	} else {
		debug = false
	}
 	go RemoveToken() // Multi-thread call for RemoveToken
	// call function to initialize connection with Jarvis
	connectToDB()
	// Create a server variable so we can do clean shutdowns
	srv := http.Server{ Addr: ":" + strconv.Itoa(*port) }

	// Register Handlers (using default serve mux)
	// register.go
	http.HandleFunc("/create", CreateUser)
	http.HandleFunc("/store",  StoreSecret)
	// auth.go
	http.HandleFunc("/auth/1", AuthStep1)
	http.HandleFunc("/auth/2", AuthStep2)
	http.HandleFunc("/getpk/", GetPublicKey)
	// chat.go
	http.HandleFunc("/newChat",    NewChat)
	http.HandleFunc("/acceptChat", AcceptChat)
	http.HandleFunc("/findChat",   FindChat)
	// message.go
	http.HandleFunc("/send",     SendMessage)
	http.HandleFunc("/retrieve", GetMessages)

	// Run server
	// If DEBUG set, allow for HTTP (instead of HTTPS)
	if debug && *insecure {
		Fatal(srv.ListenAndServe().Error(), 1)
	} else {
		Fatal(srv.ListenAndServeTLS("./cert.pem", "./key.pem").Error(), 1)
	}
}
