package main

import (
	"fmt"
	"os"
)

const (
	RED     = "\x1b[31m"
	GREEN   = "\x1b[32m"
//	YELLOW  = "\x1b[33m"
	BLUE    = "\x1b[34m"
	MAGENTA = "\x1b[35m"
//	CYAN    = "\x1b[36m"
	UNSET   = "\x1b[0m"
)

var (
	Verbosity = 0
	LogFile  = os.Stdout
	ErrLog   = os.Stderr
)

func SetLogFile(fileName string) {
	file, err := os.OpenFile(fileName, os.O_WRONLY | os.O_APPEND | os.O_CREATE, 0644)
	if err != nil {
		Fatal("Unable to open file: " + fileName, 1)
	}
	LogFile = file
}

func SetErrFile(fileName string) {
	file, err := os.OpenFile(fileName, os.O_WRONLY | os.O_APPEND | os.O_CREATE, 0644)
	if err != nil {
		Fatal("Unable to open file: " + fileName, 1)
	}
    ErrLog = file
}

func Fatal(str string, code int) {
	fmt.Fprintf(ErrLog, "[%sFATAL%s]: %s%s%s\n", RED, UNSET, RED, str, UNSET)
	os.Exit(code)
}

func Error(str string) {
	if (Verbosity > 0) {
		fmt.Fprintf(ErrLog, "[%sERR%s]:  %s%s%s\n", RED, UNSET, RED, str, UNSET)
	}
}

func Warn(str string) {
	if (Verbosity > 1) {
		fmt.Fprintf(LogFile, "[%sWARN%s]: %s%s%s\n", MAGENTA, UNSET, MAGENTA, str, UNSET)
	}
}

func Info(str string) {
	if (Verbosity > 2) {
		fmt.Fprintf(LogFile, "[%sINFO%s]: %s%s%s\n", BLUE, UNSET, BLUE, str, UNSET)
	}
}

func Endpoint(endpoint string, data string) {
	if (Verbosity > 3) {
		fmt.Fprintf(LogFile, "[%sEND%s]:  %s%s%s || %s%s%s\n", GREEN, UNSET, GREEN, endpoint, UNSET,
			GREEN, data, UNSET)
	}
}
