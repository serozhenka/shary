package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		DatabaseURL: getEnv("DB_URL"),
		JWTSecret:   getEnv("JWT_SECRET"),
		Port:        getEnv("PORT"),
	}

	return config
}

func getEnv(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	log.Panicf("Missing environment variable: %s", key)
	return ""
}
