package main

// Includes
import (
	"database/sql"
	"flag"
	_ "github.com/lib/pq"
	"log"
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
	connStr := "user=server dbname=cryptik sslcert=cert.pem sslkey=key.pem"
	Jarvis, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	if err = Jarvis.Ping(); err != nil {
		log.Fatal(err)
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
		log.Fatal(srv.ListenAndServe())
	} else {
		log.Fatal(srv.ListenAndServeTLS("./cert.pem", "./key.pem"))
	}
}