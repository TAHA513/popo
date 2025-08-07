import { db } from "./db";
import { pointPackages } from "@shared/schema";
import { eq } from "drizzle-orm";

// Point packages data - سعر النقطة: كل 100 نقطة = 1.30 دولار
const packages = [
  {
    name: "باقة البداية", // ~384 نقطة مقابل 5 دولار
    pointAmount: 400,
    priceInCents: 500, // $5.00
    priceDisplay: "$5.00",
    currency: "USD",
    bonusPoints: 16, // مكافأة إضافية 4%
    isPopular: false,
    displayOrder: 1,
  },
  {
    name: "باقة شائعة", // ~769 نقطة مقابل 10 دولار
    pointAmount: 800,
    priceInCents: 1000, // $10.00
    priceDisplay: "$10.00",
    currency: "USD",
    bonusPoints: 50, // مكافأة إضافية 6.25%
    isPopular: true,
    displayOrder: 2,
  },
  {
    name: "باقة رائعة", // ~1538 نقطة مقابل 20 دولار
    pointAmount: 1600,
    priceInCents: 2000, // $20.00
    priceDisplay: "$20.00",
    currency: "USD",
    bonusPoints: 140, // مكافأة إضافية 8.75%
    isPopular: false,
    displayOrder: 3,
  },
  {
    name: "باقة متميزة", // ~3846 نقطة مقابل 50 دولار
    pointAmount: 4000,
    priceInCents: 5000, // $50.00
    priceDisplay: "$50.00",
    currency: "USD",
    bonusPoints: 400, // مكافأة إضافية 10%
    isPopular: false,
    displayOrder: 4,
  },
  {
    name: "باقة ملكية", // ~7692 نقطة مقابل 100 دولار
    pointAmount: 8000,
    priceInCents: 10000, // $100.00
    priceDisplay: "$100.00",
    currency: "USD",
    bonusPoints: 1000, // مكافأة إضافية 12.5%
    isPopular: false,
    displayOrder: 5,
  },
  {
    name: "باقة الأسطورة", // ~15384 نقطة مقابل 200 دولار
    pointAmount: 16000,
    priceInCents: 20000, // $200.00
    priceDisplay: "$200.00",
    currency: "USD",
    bonusPoints: 2500, // مكافأة إضافية 15.6%
    isPopular: false,
    displayOrder: 6,
  },
];

export async function initializePointPackages() {
  try {
    console.log("🔄 Initializing point packages...");
    
    // Check if packages already exist
    const existingPackages = await db.select().from(pointPackages);
    
    if (existingPackages.length > 0) {
      console.log("✅ Point packages already exist, skipping initialization");
      return;
    }

    // Insert packages
    for (const packageData of packages) {
      await db.insert(pointPackages).values({
        ...packageData,
        isActive: true,
      });
    }

    console.log("✅ Point packages initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing point packages:", error);
  }
}