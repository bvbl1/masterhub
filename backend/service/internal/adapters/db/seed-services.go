package db

import (
	"log"

	"github.com/lib/pq"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Provider ID map (insertion order from seedUsers — admin is ID 1):
//  2 - Aibek Seitkali
//  3 - Daniyar Bekov
//  4 - Nurlan Ospanov
//  5 - Yerlan Akhmetov
//  6 - Sanzhar Mamytbekov
//  7 - Zhanna Tulegenova
//  8 - Aliya Dosova
//  9 - Bauyrzhan Rakhimov
//
// Category ID map (insertion order from seedCategories):
//  1  Apartment Renovation      2  House Construction       3  Electrical Works
//  4  Plumbing                  5  Heating and Boilers      6  Plastering and Putty
//  7  Wallpaper and Painting    8  Tile Installation        9  Stretch Ceilings
// 10  Drywall Works            11  Windows and Doors       12  Landscape Design
// 13  Roofing Works            14  Foundation Works

func seedServices(db *gorm.DB) error {
	var count int64
	if err := db.Model(&Service{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Services table is not empty — skipping seeding")
		return nil
	}

	services := []Service{

		// ── 1. Apartment Renovation ───────────────────────────────────────────────
		{
			ProviderId:  2, // Aibek Seitkali
			CategoryId:  1,
			Title:       "Turnkey Apartment Renovation",
			Description: "Full renovation from rough works to final finish — floors, walls, ceilings, plumbing, electrics. Fixed-price contract, no hidden costs.",
			PriceStart:  decimal.NewFromInt(500000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
				"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
				"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
			},
		},
		{
			ProviderId:  3, // Daniyar Bekov
			CategoryId:  1,
			Title:       "Economy-Class Apartment Renovation",
			Description: "Budget-friendly finish renovation: leveling, wallpaper, laminate, painting. Ideal for rental properties.",
			PriceStart:  decimal.NewFromInt(180000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
				"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
			},
		},
		{
			ProviderId:  3, // Daniyar Bekov
			CategoryId:  1,
			Title:       "Designer Renovation with 3D Project",
			Description: "Premium renovation with interior design included. 3D visualisation before work starts. European materials only.",
			PriceStart:  decimal.NewFromInt(900000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
				"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
			},
		},

		// ── 2. House Construction ─────────────────────────────────────────────────
		{
			ProviderId:  4, // Nurlan Ospanov
			CategoryId:  2,
			Title:       "Turnkey Private House Construction",
			Description: "Complete construction of private houses up to 300 m²: foundation, frame, roof, facade, interior. Warranty 5 years.",
			PriceStart:  decimal.NewFromInt(15000000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&q=80",
				"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
			},
		},
		{
			ProviderId:  4, // Nurlan Ospanov
			CategoryId:  2,
			Title:       "Prefabricated Frame House (SIP Panels)",
			Description: "Energy-efficient SIP-panel homes. Construction in 60 days. All utilities included in project scope.",
			PriceStart:  decimal.NewFromInt(8000000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
			},
		},

		// ── 3. Electrical Works ───────────────────────────────────────────────────
		{
			ProviderId:  2, // Aibek Seitkali
			CategoryId:  3,
			Title:       "Apartment Rewiring",
			Description: "Complete rewiring: new cable routing, panel upgrade, earthing, socket and switch installation. Certificate issued.",
			PriceStart:  decimal.NewFromInt(80000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80",
				"https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&q=80",
			},
		},
		{
			ProviderId:  5, // Yerlan Akhmetov
			CategoryId:  3,
			Title:       "Smart Home Lighting Setup",
			Description: "Installation of smart switches, LED strips, motion sensors and integration with Alexa / Google Home.",
			PriceStart:  decimal.NewFromInt(45000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
			},
		},
		{
			ProviderId:  5, // Yerlan Akhmetov
			CategoryId:  3,
			Title:       "Electrical Panel Replacement",
			Description: "Old fuse-box to modern circuit-breaker panel upgrade. RCD installation, load balancing, full labelling.",
			PriceStart:  decimal.NewFromInt(35000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
			},
		},

		// ── 4. Plumbing ───────────────────────────────────────────────────────────
		{
			ProviderId:  2, // Aibek Seitkali
			CategoryId:  4,
			Title:       "Emergency Pipe Repair",
			Description: "Fast response for burst pipes, leaks and emergency shut-off. Available 24/7 across Astana.",
			PriceStart:  decimal.NewFromInt(15000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
			},
		},
		{
			ProviderId:  2, // Aibek Seitkali
			CategoryId:  4,
			Title:       "Bathroom Sanitary Installation",
			Description: "Full installation of sinks, toilets, bathtubs and shower cabins. Work guaranteed for 2 years.",
			PriceStart:  decimal.NewFromInt(35000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
				"https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
			},
		},
		{
			ProviderId:  6, // Sanzhar Mamytbekov
			CategoryId:  4,
			Title:       "Water Filter & Purification System Installation",
			Description: "Supply and installation of reverse osmosis and multi-stage filtration systems for kitchen and whole-house use.",
			PriceStart:  decimal.NewFromInt(25000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
			},
		},

		// ── 5. Heating and Boilers ────────────────────────────────────────────────
		{
			ProviderId:  5, // Yerlan Akhmetov
			CategoryId:  5,
			Title:       "Boiler Installation & Commissioning",
			Description: "Gas and electric boiler installation, pressure testing, commissioning. All brands. Licensed gas engineers.",
			PriceStart:  decimal.NewFromInt(60000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
			},
		},
		{
			ProviderId:  5, // Yerlan Akhmetov
			CategoryId:  5,
			Title:       "Underfloor Heating Installation",
			Description: "Electric and water underfloor heating systems. Tile, laminate and engineered wood compatible. Thermostat included.",
			PriceStart:  decimal.NewFromInt(4000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
			},
		},

		// ── 6. Plastering and Putty ───────────────────────────────────────────────
		{
			ProviderId:  3, // Daniyar Bekov
			CategoryId:  6,
			Title:       "Machine Plastering",
			Description: "High-speed machine plaster application — smooth finish ready for wallpaper or paint. Up to 150 m² per day.",
			PriceStart:  decimal.NewFromInt(1800),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
			},
		},
		{
			ProviderId:  6, // Sanzhar Mamytbekov
			CategoryId:  6,
			Title:       "Fine Putty & Sanding (ready for painting)",
			Description: "Two-coat finish putty, sanding to class 4 smoothness. Ideal preparation before premium paint or wallpaper.",
			PriceStart:  decimal.NewFromInt(1200),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
			},
		},

		// ── 7. Wallpaper and Painting ─────────────────────────────────────────────
		{
			ProviderId:  7, // Zhanna Tulegenova
			CategoryId:  7,
			Title:       "Decorative Wall Painting",
			Description: "Feature walls, textured finishes, Venetian stucco, colour consultation included. Eco-friendly paints only.",
			PriceStart:  decimal.NewFromInt(2000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
				"https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
			},
		},
		{
			ProviderId:  7, // Zhanna Tulegenova
			CategoryId:  7,
			Title:       "Wallpaper Hanging (all types)",
			Description: "Hanging of vinyl, non-woven, photo and liquid wallpaper. Pattern matching included. No extra charge for corners.",
			PriceStart:  decimal.NewFromInt(800),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
			},
		},

		// ── 8. Tile Installation ──────────────────────────────────────────────────
		{
			ProviderId:  2, // Aibek Seitkali
			CategoryId:  8,
			Title:       "Kitchen & Bathroom Tiling",
			Description: "Precision tile laying — ceramic, porcelain stoneware, mosaic. Joints sealed with colour-matched grout.",
			PriceStart:  decimal.NewFromInt(3500),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80",
				"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
			},
		},
		{
			ProviderId:  8, // Aliya Dosova
			CategoryId:  8,
			Title:       "Large-Format Tile Installation (60×60 and above)",
			Description: "Specialist installation of large-format slabs and tiles. Lippage-free result guaranteed. Floor and wall.",
			PriceStart:  decimal.NewFromInt(5000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
			},
		},

		// ── 9. Stretch Ceilings ───────────────────────────────────────────────────
		{
			ProviderId:  9, // Bauyrzhan Rakhimov
			CategoryId:  9,
			Title:       "PVC Stretch Ceiling Installation",
			Description: "Matte, satin and gloss PVC ceilings. Any colour from catalogue. Standard room installed in one day.",
			PriceStart:  decimal.NewFromInt(3000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80",
			},
		},
		{
			ProviderId:  9, // Bauyrzhan Rakhimov
			CategoryId:  9,
			Title:       "Fabric Stretch Ceiling with Backlit",
			Description: "Translucent fabric ceilings with LED backlighting. Star-sky effect available. Fully washable material.",
			PriceStart:  decimal.NewFromInt(5500),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
			},
		},

		// ── 10. Drywall Works ─────────────────────────────────────────────────────
		{
			ProviderId:  6, // Sanzhar Mamytbekov
			CategoryId:  10,
			Title:       "Drywall Partitions & Ceilings",
			Description: "Metal frame construction, single and double-layer plasterboard. Fire-rated and soundproof options available.",
			PriceStart:  decimal.NewFromInt(4500),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
			},
		},
		{
			ProviderId:  9, // Bauyrzhan Rakhimov
			CategoryId:  10,
			Title:       "Multi-Level Drywall Ceiling with Lighting Niches",
			Description: "Two- and three-level GKL ceilings with integrated LED strips and spot lighting niches. Design consultation included.",
			PriceStart:  decimal.NewFromInt(6500),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
			},
		},

		// ── 11. Windows and Doors ─────────────────────────────────────────────────
		{
			ProviderId:  4, // Nurlan Ospanov
			CategoryId:  11,
			Title:       "PVC Window Replacement",
			Description: "Supply and installation of double and triple glazed PVC windows. Measurement visit free of charge.",
			PriceStart:  decimal.NewFromInt(70000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800&q=80",
			},
		},
		{
			ProviderId:  5, // Yerlan Akhmetov
			CategoryId:  11,
			Title:       "Interior Door Installation",
			Description: "Fitting and installation of interior doors — swing, sliding, and pocket. Frame, architrave and handles included.",
			PriceStart:  decimal.NewFromInt(18000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80",
			},
		},

		// ── 12. Landscape Design ──────────────────────────────────────────────────
		{
			ProviderId:  8, // Aliya Dosova
			CategoryId:  12,
			Title:       "Garden Landscaping & Lawn Installation",
			Description: "Soil preparation, roll-lawn laying, planting beds, automatic irrigation system. Maintenance plans available.",
			PriceStart:  decimal.NewFromInt(250000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
				"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
			},
		},
		{
			ProviderId:  8, // Aliya Dosova
			CategoryId:  12,
			Title:       "Garden Pathway & Paving Installation",
			Description: "Concrete paving slabs, natural stone, brick paving. Edging, sand bedding and drainage included.",
			PriceStart:  decimal.NewFromInt(5000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
			},
		},

		// ── 13. Roofing Works ─────────────────────────────────────────────────────
		{
			ProviderId:  4, // Nurlan Ospanov
			CategoryId:  13,
			Title:       "Metal Tile Roof Installation",
			Description: "Full roofing turnkey: insulation, vapour barrier, metal tile, ridge and drainage system. Warranty 10 years.",
			PriceStart:  decimal.NewFromInt(2500),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&q=80",
			},
		},
		{
			ProviderId:  7, // Zhanna Tulegenova
			CategoryId:  13,
			Title:       "Soft Roof (Bitumen Shingle) Installation",
			Description: "Installation of flexible bitumen shingles on any roof geometry. Underlayment, drip edge and ridge caps included.",
			PriceStart:  decimal.NewFromInt(2000),
			IsActive:    true,
			City:        "Almaty",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
			},
		},

		// ── 14. Foundation Works ──────────────────────────────────────────────────
		{
			ProviderId:  3, // Daniyar Bekov
			CategoryId:  14,
			Title:       "Strip Foundation for Private Houses",
			Description: "Excavation, formwork, reinforcement cage, concrete pouring and waterproofing. Soil analysis included.",
			PriceStart:  decimal.NewFromInt(1200000),
			IsActive:    true,
			City:        "Astana",
			PhotoUrls: pq.StringArray{
				"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
			},
		},
	}

	if err := db.Create(&services).Error; err != nil {
		return err
	}

	log.Printf("Services seeded successfully! (%d records)", len(services))
	return nil
}
