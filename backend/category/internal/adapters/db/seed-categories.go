package db

import (
	"log"

	"gorm.io/gorm"
)

func seedCategories(db *gorm.DB) error {
	var count int64
	if err := db.Model(&Category{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Categories table is not empty — skipping seeding")
		return nil
	}

	//chnage these icons to your own categories
	categories := []Category{
		{CategoryName: "Apartment Renovation", Description: "Full renovation, rough and finish works", Icon: "https://example.com/icons/apartment.png"},
		{CategoryName: "House Construction", Description: "Building private houses and cottages turnkey", Icon: "https://example.com/icons/house.png"},
		{CategoryName: "Electrical Works", Description: "Wiring installation, electrical panels, lighting, smart home systems", Icon: "https://example.com/icons/electrical.png"},
		{CategoryName: "Plumbing", Description: "Pipe routing, sanitary ware installation, sewerage", Icon: "https://example.com/icons/plumbing.png"},
		{CategoryName: "Heating and Boilers", Description: "Heating systems installation, gas and solid fuel boilers", Icon: "https://example.com/icons/heating.png"},
		{CategoryName: "Plastering and Putty", Description: "Wall and ceiling leveling", Icon: "https://example.com/icons/plastering.png"},
		{CategoryName: "Wallpaper and Painting", Description: "Final wall finishing", Icon: "https://example.com/icons/wallpaper.png"},
		{CategoryName: "Tile Installation", Description: "Floors, walls, mosaic, porcelain stoneware", Icon: "https://example.com/icons/tile.png"},
		{CategoryName: "Stretch Ceilings", Description: "Installation of PVC and fabric stretch ceilings", Icon: "https://example.com/icons/stretch.png"},
		{CategoryName: "Drywall Works", Description: "Partitions, boxes, multi-level ceilings", Icon: "https://example.com/icons/drywall.png"},
		{CategoryName: "Windows and Doors", Description: "Installation of plastic windows, entrance and interior doors", Icon: "https://example.com/icons/windows.png"},
		{CategoryName: "Landscape Design", Description: "Landscaping, lawn laying, pathways", Icon: "https://example.com/icons/landscape.png"},
		{CategoryName: "Roofing Works", Description: "Installation of metal tiles, soft roofing, slate", Icon: "https://example.com/icons/roofing.png"},
		{CategoryName: "Foundation Works", Description: "Strip, slab, and pile foundations", Icon: "https://example.com/icons/foundation.png"},
	}

	if err := db.Create(&categories).Error; err != nil {
		return err
	}

	log.Println("Categories seeded successfully!")
	return nil
}
