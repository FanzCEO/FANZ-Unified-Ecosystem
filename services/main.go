package main

import (
	"log"
	"os"
	"os/exec"
)

func main() {
	// This is the deployment entry point for Render
	// It starts the API Gateway which serves as the main web server
	
	log.Println("Starting Fanz Operating System server...")
	
	// Set default environment variables if not already set
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
	}
	if os.Getenv("REDIS_URL") == "" {
		os.Setenv("REDIS_URL", "redis://localhost:6379")
	}
	
	// Change to API Gateway directory and run
	cmd := exec.Command("go", "run", "main.go")
	cmd.Dir = "./services/api-gateway"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()
	
	if err := cmd.Run(); err != nil {
		log.Fatalf("Failed to start API Gateway: %v", err)
	}
}