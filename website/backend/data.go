package main

import (
	"encoding/json"
	"net/http"
)

func dataHandler(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	rows, err := queryRows("SELECT * FROM data")
	
}