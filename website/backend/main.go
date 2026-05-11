package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"log"
)

var db *sql.DB

func BlogHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != http.MethodGet || r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == http.MethodGet {
		// Handle GET request
		blogs := getBlogs()
		for _, blog := range blogs {
			fmt.Fprintf(w, "%s\n", blog)
		}

	} else if r.Method == http.MethodPost {
		// Handle POST request
		r.ParseForm()
		blog := r.FormValue("blog")
		saveBlog(blog)
	}
}

func getBlogs() []string {
	// Simulate fetching blogs
	return []string{"Blog 1", "Blog 2", "Blog 3"}
}

func saveBlog(blog string) {
	// Simulate saving a blog
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	fmt.Fprintln(w, "Hello World - API")

}

func healthHandler(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := db.Ping(); err != nil{
		http.Error(w, "DB unreachable: " + err.Error(), http.StatusInternalServerError)
		return
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

	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/blog", )
	http.ListenAndServe(":8000", nil)
}
