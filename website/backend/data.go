package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

type BlogDTO struct {
	Title string `json:"blogTitle"`
	Body  string `json:"blogBody"`
}

func BlogHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		// Handle GET request
		getBlogs(w, r)
	case http.MethodPost:
		// Handle POST request
		var blogDTO BlogDTO
		if err := json.NewDecoder(r.Body).Decode(&blogDTO); err != nil {
			http.Error(w, "Failed to decode blog data: "+err.Error(), http.StatusBadRequest)
			return
		}
		saveBlog(blogDTO, w, r)
	}
}

func getBlogs(w http.ResponseWriter, r *http.Request) {
	rows, err := queryRows("SELECT * FROM data")
	if err != nil {
		http.Error(w, "Failed to query data: "+err.Error(), http.StatusInternalServerError)
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

func saveBlog(dto BlogDTO, w http.ResponseWriter, r *http.Request) error {
	if dto.Title == "" || dto.Body == "" {
		http.Error(w, "Title and Body are required", http.StatusBadRequest)
		return fmt.Errorf("missing title or body")
	}
	payload := map[string]interface{}{
		"title": dto.Title,
		"body":  dto.Body,
	}
	if err := insertRow(payload); err != nil {
		http.Error(w, "Failed to save blog: "+err.Error(), http.StatusInternalServerError)
		return err
	}
	w.WriteHeader(http.StatusCreated)
	return nil
}

var validIdentifier = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func insertRow(data map[string]interface{}) error {
	cols := make([]string, 0, len(data))
	vals := make([]interface{}, 0, len(data))
	placeholders := make([]string, 0, len(data))
	i := 1
	for col, val := range data {
		if !validIdentifier.MatchString(col) {
			return fmt.Errorf("invalid column name: %s", col)
		}
		cols = append(cols, col)
		vals = append(vals, val)
		placeholders = append(placeholders, fmt.Sprintf("$%d", i))
		i++
	}

	query := fmt.Sprintf(
		"INSERT INTO data (%s) VALUES (%s)",
		strings.Join(cols, ", "),
		strings.Join(placeholders, ", "))
	_, err := db.Exec(query, vals...)
	return err
}
