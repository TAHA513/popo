import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { requireAuth } from "../localAuth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export function registerStripeRoutes(app: Express) {
  // Get all point packages
  app.get('/api/point-packages', async (req: any, res) => {
    try {
      console.log("🔍 Fetching point packages...");
      const packages = await storage.getPointPackages();
      console.log("✅ Found packages:", packages.length);
      res.json(packages);
    } catch (error) {
      console.error("❌ Error fetching point packages:", error);
      res.status(500).json({ message: "خطأ في جلب حزم النقاط" });
    }
  });

  // Create payment intent for point purchase
  app.post('/api/create-payment-intent', requireAuth, async (req: any, res) => {
    try {
      const { packageId } = req.body;
      const userId = req.user.id;

      if (!packageId) {
        return res.status(400).json({ message: "معرف الحزمة مطلوب" });
      }

      // Get package details
      const pointPackage = await storage.getPointPackageById(packageId);
      if (!pointPackage) {
        return res.status(404).json({ message: "حزمة النقاط غير موجودة" });
      }

      if (!pointPackage.isActive) {
        return res.status(400).json({ message: "حزمة النقاط غير متاحة حالياً" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: pointPackage.priceInCents,
        currency: pointPackage.currency.toLowerCase(),
        metadata: {
          userId: userId,
          packageId: packageId.toString(),
          packageName: pointPackage.name,
          pointAmount: pointPackage.pointAmount.toString(),
          bonusPoints: pointPackage.bonusPoints.toString()
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        package: pointPackage
      });
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", error);
      res.status(500).json({ message: "خطأ في إنشاء عملية الدفع: " + error.message });
    }
  });

  // Confirm payment and add points to user
  app.post('/api/confirm-payment', requireAuth, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "معرف الدفعة مطلوب" });
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "عملية الدفع لم تكتمل بنجاح" });
      }

      // Verify user matches
      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ message: "غير مصرح لك بهذه العملية" });
      }

      // Check if already processed
      const existingTransaction = await storage.getPointTransactionByStripeId(paymentIntentId);
      if (existingTransaction) {
        return res.status(400).json({ message: "تم معالجة هذه الدفعة مسبقاً" });
      }

      const packageId = parseInt(paymentIntent.metadata.packageId);
      
      // Process the purchase
      const result = await storage.purchasePoints(userId, packageId, paymentIntentId);

      res.json({ 
        success: true, 
        message: "تم شراء النقاط بنجاح!",
        newBalance: result.newBalance,
        pointsAdded: parseInt(paymentIntent.metadata.pointAmount) + parseInt(paymentIntent.metadata.bonusPoints)
      });
    } catch (error: any) {
      console.error("❌ Error confirming payment:", error);
      res.status(500).json({ message: "خطأ في تأكيد عملية الدفع: " + error.message });
    }
  });

  // Get user's payment history
  app.get('/api/payment-history', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getUserPointTransactions(userId, 50);
      
      // Filter only payment transactions
      const paymentTransactions = transactions.filter(t => t.type === 'payment');
      
      res.json(paymentTransactions);
    } catch (error) {
      console.error("❌ Error fetching payment history:", error);
      res.status(500).json({ message: "خطأ في جلب سجل المدفوعات" });
    }
  });

  console.log("✅ Stripe routes configured");
}