package main

// Includes
import (
	"database/sql"
	"flag"
	_ "github.com/lib/pq"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"os"
)

var Jarvis *sql.DB

// Command Line Arugments
var (
    host     = flag.String("host", "127.0.0.1", "Host Postgres instance is running at")
	port     = flag.Int("port", 4443, "Port to run HTTP Server on")
	insecure = flag.Bool("i", false, "Run over HTTP instead of HTTPS. This also requires the " +
		"DEBUG variable to be set")
    Verbosity = flag.Int("v", 1, "Verbosity level 0-4")
	logFile  = flag.String("l", "os.Stdout", "Log file to write to")
	errFile  = flag.String("e", "os.Stderr", "Error file to write to")
	
	debug    = false
)

func connectToDB() {
	connStr := "user=postgres dbname=postgres password=unused host=" + *host
    var err error
	Jarvis, err = sql.Open("postgres", connStr)
	if err != nil {
		Fatal(err.Error(), 1)
	}
	if err = Jarvis.Ping(); err != nil {
		Fatal(err.Error(), 1)
	}
	Info("Database connected")
}

func fileServer(w http.ResponseWriter, r *http.Request) {
    Endpoint("/", r.URL.Path)
	data, err := ioutil.ReadFile("." + r.URL.Path)
	if err != nil {
		Error(err.Error())
		w.WriteHeader(404)
		return
	}
	if strings.HasSuffix(r.URL.Path, ".js") {
		w.Header().Add("Content-Type", "application/javascript")
	}
	if strings.HasSuffix(r.URL.Path, ".css") {
		w.Header().Add("Content-Type", "text/css")
	}
	if strings.HasSuffix(r.URL.Path, ".html") {
		w.Header().Add("Content-Type", "text/html")
	}
	w.Header().Add("X-Content-Type-Options", "nosniff")
	_, err = w.Write(data)
	if err != nil {
		Error(err.Error())
		w.WriteHeader(404)
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
	if *logFile != "os.Stdout" {
		SetLogFile(*logFile)
	}
	if *errFile != "os.Stderr" {
		SetErrFile(*errFile)
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
	
	http.HandleFunc("/", fileServer)

	// Run server
	// If DEBUG set, allow for HTTP (instead of HTTPS)
	if debug && *insecure {
		Warn("Using HTTP instead of HTTPS. Much of the JavaScript code will not work")
		Fatal(srv.ListenAndServe().Error(), 1)
	} else {
		Fatal(srv.ListenAndServeTLS("./cert.pem", "./key.pem").Error(), 1)
	}
}
