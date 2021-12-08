package log

import (
	"fmt"
	"os"
)

const (
	RED     = "\x1b[31m"
	GREEN   = "\x1b[32m"
	YELLOW  = "\x1b[33m"
	BLUE    = "\x1b[34m"
	MAGENTA = "\x1b[35m"
	CYAN    = "\x1b[36m"
	UNSET   = "\x1b[0m"
)

var (
	Verbosity = 0
	LogFile  = os.Stdout
	ErrLog   = os.Stderr
)

func SetLogFile(fileName string) {
	file, err := os.OpenFile(str, O_WRONLY | O_APPEND | O_CREAT, 0644)
	if err != nil {
		Fatal("Unable to open file: " + fileName, 1)
	}
	LogFile = file
}
// TODO SetErrFile

func Fatal(str string, code int) {
	fmt.FPrintf(Errlog, "[%sFATAL%s]: %s\n", RED, UNSET)
	os.Exit(code)
}

func Error(str string) {
	fmt.FPrintf(Errlog, "[%sERR%s]:  %s%s%s\n", RED, UNSET, RED, str, UNSET)
}

func Warn(str string) {
	fmt.FPrintf(LogFile, "[%sWARN%s]: %s%s%s\n", MAGENTA, UNSET, MAGENTA, str, UNSET)
}

func Info(str string) {
	fmt.FPrintf(LogFile, "[%sINFO%s]: %s%s%s\n", BLUE, UNSET, BLUE, str, UNSET)
}

func Endpoint(endpoint string, data string) {
	fmt.FPrintf(LogFile, "[%sEND%s]:  %s%s%s || %s%s%s\n", GREEN, UNSET, GREEN, endpoint, UNSET,
		GREEN, data, UNSET)
}
