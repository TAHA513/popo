import { db } from "./db";
import { pointPackages } from "@shared/schema";
import { eq } from "drizzle-orm";

// Point packages data
const packages = [
  {
    name: "حزمة صغيرة",
    pointAmount: 100,
    priceInCents: 499, // $4.99
    priceDisplay: "$4.99",
    currency: "USD",
    bonusPoints: 10,
    isPopular: false,
    displayOrder: 1,
  },
  {
    name: "حزمة متوسطة",
    pointAmount: 250,
    priceInCents: 999, // $9.99
    priceDisplay: "$9.99",
    currency: "USD",
    bonusPoints: 50,
    isPopular: true,
    displayOrder: 2,
  },
  {
    name: "حزمة كبيرة",
    pointAmount: 500,
    priceInCents: 1999, // $19.99
    priceDisplay: "$19.99",
    currency: "USD",
    bonusPoints: 150,
    isPopular: false,
    displayOrder: 3,
  },
  {
    name: "حزمة ضخمة",
    pointAmount: 1000,
    priceInCents: 3499, // $34.99
    priceDisplay: "$34.99",
    currency: "USD",
    bonusPoints: 400,
    isPopular: false,
    displayOrder: 4,
  },
  {
    name: "حزمة ممتازة",
    pointAmount: 2500,
    priceInCents: 7999, // $79.99
    priceDisplay: "$79.99",
    currency: "USD",
    bonusPoints: 1250,
    isPopular: false,
    displayOrder: 5,
  },
  {
    name: "حزمة الملك",
    pointAmount: 5000,
    priceInCents: 14999, // $149.99
    priceDisplay: "$149.99",
    currency: "USD",
    bonusPoints: 3000,
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