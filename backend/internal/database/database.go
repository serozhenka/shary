package database

import (
	"log"

	"github.com/serozhenka/shary/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return err
	}

	log.Println("Connected to database successfully")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(&models.User{})
	if err != nil {
		return err
	}

	log.Println("Database migration completed successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
