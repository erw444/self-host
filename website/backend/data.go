package main

import (
	"encoding/json"
	"net/http"
)

func BlogHandler(w http.ResponseWriter, r *http.Request) {
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

func getBlogs(w http.ResponseWriter, r *http.Request){
	rows, err := queryRows("SELECT * FROM data")
	if err != nil {
		http.Error(w, "Failed to query data: " + err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rows)
}

func queryRows(query string, args ...interface{}) ([]map[string]interface{}, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	
	var results []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]interface{})
		for i, col := range columns {
			rowMap[col] = values[i]
		}
		results = append(results, rowMap)
	}
	return results, nil
}