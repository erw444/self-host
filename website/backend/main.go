package main

import (
	"fmt"
	"net/http"
)

func BlogHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method!= http.MethodGet || r.Method!= http.MethodPost {
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

func main() {
	http.HandleFunc("/", BlogHandler)
	http.ListenAndServe(":8000", nil)
}