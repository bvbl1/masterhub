package db

import (
	"log"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Seeded identities (from user-service seedUsers):
//   ReviewerId (customer) = 3  — customer@masterhub.kz
//   ProviderId            = 2  — provider@masterhub.kz
//
// Service IDs match seed-services.go insertion order:
//   1  - Emergency Pipe Repair          (Plumbing)
//   2  - Bathroom Sanitary Installation (Plumbing)
//   3  - Apartment Rewiring             (Electrical Works)
//   4  - Smart Home Lighting Setup      (Electrical Works)
//   5  - Kitchen & Bathroom Tiling      (Tile Installation)
//   6  - Decorative Wall Painting       (Wallpaper and Painting)
//   7  - Turnkey Apartment Renovation   (Apartment Renovation)
//   8  - Drywall Partitions & Ceilings  (Drywall Works)
//   9  - PVC Stretch Ceiling Install    (Stretch Ceilings)
//  10  - Boiler Installation & Service  (Heating and Boilers)
//  11  - PVC Window Replacement         (Windows and Doors)
//
// OrderId uses high placeholder values (9001+) to avoid colliding
// with real orders created during the demo.

func seedReviews(db *gorm.DB) error {
	var count int64
	if err := db.Model(&Review{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Reviews table is not empty — skipping seeding")
		return nil
	}

	reviews := []Review{
		{
			OrderId:    9001,
			ServiceId:  1,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Came within an hour, fixed the burst pipe quickly and cleanly. No mess left behind. Highly recommend!",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9002,
			ServiceId:  1,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     4,
			Comment:    "Good work overall, arrived a bit late but the repair itself was solid. Would use again.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9003,
			ServiceId:  2,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Installed a new toilet and sink perfectly. Very tidy, explained everything clearly. Great service.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9004,
			ServiceId:  3,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Full rewire done in two days. All work is certified, everything works perfectly. Very professional team.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9005,
			ServiceId:  3,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     4,
			Comment:    "Solid electrical work. A few minor delays but the end result is great and passed inspection.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9006,
			ServiceId:  4,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Smart lighting set up throughout the apartment. Works with Alexa perfectly. Very happy with the result.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9007,
			ServiceId:  5,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     4,
			Comment:    "Tiles laid very evenly, joints are clean. Took one extra day but quality is worth it.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9008,
			ServiceId:  6,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Beautiful feature wall in the living room. Colour consultation was really helpful. Exceeded expectations.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9009,
			ServiceId:  7,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "Full apartment renovation done on time and within budget. The team was professional from start to finish.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9010,
			ServiceId:  9,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     4,
			Comment:    "Stretch ceiling looks great, installed in half a day as promised. Minor issue with one edge — fixed immediately.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9011,
			ServiceId:  10,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     5,
			Comment:    "New boiler installed and working perfectly. Engineer was knowledgeable and explained the controls clearly.",
			PhotoURLs:  pq.StringArray{},
		},
		{
			OrderId:    9012,
			ServiceId:  11,
			ReviewerId: 3,
			ProviderId: 2,
			Rating:     4,
			Comment:    "Windows look great and the flat is noticeably warmer. Installation took longer than quoted but quality is good.",
			PhotoURLs:  pq.StringArray{},
		},
	}

	if err := db.Create(&reviews).Error; err != nil {
		return err
	}

	log.Printf("Reviews seeded successfully! (%d records)", len(reviews))
	return nil
}
