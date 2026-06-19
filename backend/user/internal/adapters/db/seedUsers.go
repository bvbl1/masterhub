package db

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedUsers(db *gorm.DB) error {
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Users table is not empty — skipping seeding")
		return nil
	}

	hashPassword := func(password string) string {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("failed to hash password: %v", err)
		}
		return string(hash)
	}

	users := []User{
		//Admin
		{
			FirstName:  "Admin",
			SecondName: "User",
			Email:      "admin@masterhub.kz",
			Phone:      "87000000001",
			Password:   hashPassword("admin123"),
			Role:       "admin",
		},

		//Providers
		{
			FirstName:  "Provider",
			SecondName: "User",
			Email:      "provider@masterhub.kz",
			Phone:      "87000000002",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Aibek",
			SecondName: "Seitkali",
			Email:      "aibek.seitkali@masterhub.kz",
			Phone:      "87001110001",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Daniyar",
			SecondName: "Bekov",
			Email:      "daniyar.bekov@gmail.com",
			Phone:      "87001110002",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Nurlan",
			SecondName: "Ospanov",
			Email:      "nurlan.ospanov@gmail.com",
			Phone:      "87001110003",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Yerlan",
			SecondName: "Akhmetov",
			Email:      "yerlan.akh@mail.ru",
			Phone:      "87001110004",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Sanzhar",
			SecondName: "Mamytbekov",
			Email:      "sanzhar.m@gmail.com",
			Phone:      "87001110005",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Zhanna",
			SecondName: "Tulegenova",
			Email:      "zhanna.t@masterhub.kz",
			Phone:      "87001110006",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Aliya",
			SecondName: "Dosova",
			Email:      "aliya.dosova@gmail.com",
			Phone:      "87001110007",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},
		{
			FirstName:  "Bauyrzhan",
			SecondName: "Rakhimov",
			Email:      "bauyrzhan.r@mail.ru",
			Phone:      "87001110008",
			Password:   hashPassword("provider123"),
			Role:       "provider",
		},

		//Customers
		{
			FirstName:  "Customer",
			SecondName: "User",
			Email:      "customer@masterhub.kz",
			Phone:      "87000000003",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Dinara",
			SecondName: "Kassymova",
			Email:      "dinara.k@gmail.com",
			Phone:      "87002220001",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Marat",
			SecondName: "Zhumagaliev",
			Email:      "marat.zh@gmail.com",
			Phone:      "87002220002",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Aigerim",
			SecondName: "Nurmagambetova",
			Email:      "aigerim.n@mail.ru",
			Phone:      "87002220003",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Serik",
			SecondName: "Baizhanov",
			Email:      "serik.bai@gmail.com",
			Phone:      "87002220004",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Gulshat",
			SecondName: "Yermagambetova",
			Email:      "gulshat.y@gmail.com",
			Phone:      "87002220005",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Timur",
			SecondName: "Suleimenov",
			Email:      "timur.sul@mail.ru",
			Phone:      "87002220006",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Zarina",
			SecondName: "Abdullayeva",
			Email:      "zarina.a@gmail.com",
			Phone:      "87002220007",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
		{
			FirstName:  "Ruslan",
			SecondName: "Kenzhebayev",
			Email:      "ruslan.k@gmail.com",
			Phone:      "87002220008",
			Password:   hashPassword("customer123"),
			Role:       "customer",
		},
	}

	if err := db.Create(&users).Error; err != nil {
		return err
	}

	log.Printf("Users seeded successfully! (%d records)", len(users))
	return nil
}
