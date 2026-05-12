package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
)

var db *sql.DB

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello World - API")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if err := db.Ping(); err != nil {
		http.Error(w, "DB unreachable: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next(w, r)
	}
}

func methodMiddleware(next http.HandlerFunc, methods ...string) http.HandlerFunc {
	allowed := make(map[string]struct{}, len(methods))
	for _, m := range methods {
		allowed[m] = struct{}{}
	}
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := allowed[r.Method]; !ok {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		next(w, r)
	}
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}
	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("failed to open DB: ", err)
	}
	defer db.Close()

	http.HandleFunc("/hello", corsMiddleware(methodMiddleware(http.HandlerFunc(helloHandler), http.MethodGet)))
	http.HandleFunc("/health", corsMiddleware(methodMiddleware(http.HandlerFunc(healthHandler), http.MethodGet)))
	http.HandleFunc("/blog", corsMiddleware(methodMiddleware(http.HandlerFunc(BlogHandler), http.MethodGet, http.MethodPost)))
	http.ListenAndServe(":8000", nil)
}
