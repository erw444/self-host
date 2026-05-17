package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
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

func initDB() error {
	schema := `
	CREATE TABLE IF NOT EXISTS data (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		body TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(schema)
	return err
}

func waitForDB(maxRetries int, retryDelay time.Duration) error {
	for i := 0; i < maxRetries; i++ {
		err := db.Ping()
		if err == nil {
			log.Println("Database connection successful")
			return nil
		}
		log.Printf("Database not ready, attempt %d/%d: %v\n", i+1, maxRetries, err)
		time.Sleep(retryDelay)
	}
	return fmt.Errorf("failed to connect to database after %d attempts", maxRetries)
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

	if err := waitForDB(30, 2*time.Second); err != nil {
		log.Fatal(err)
	}

	if err := initDB(); err != nil {
		log.Fatal("failed to initialize schema: ", err)
	}

	http.HandleFunc("/hello", corsMiddleware(methodMiddleware(http.HandlerFunc(helloHandler), http.MethodGet)))
	http.HandleFunc("/health", corsMiddleware(methodMiddleware(http.HandlerFunc(healthHandler), http.MethodGet)))
	http.HandleFunc("/blog", corsMiddleware(methodMiddleware(http.HandlerFunc(BlogHandler), http.MethodGet, http.MethodPost, http.MethodPut)))
	log.Println("Listening on :8000...")
	http.ListenAndServe(":8000", nil)
}
