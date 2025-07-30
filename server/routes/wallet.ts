import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { users, userWallets, walletTransactions, gifts } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export function setupWalletRoutes(app: Express) {
  
  // Get or create user wallet
  app.get('/api/wallet', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if wallet exists
      let wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId))
        .limit(1);

      // Create wallet if doesn't exist
      if (!wallet.length) {
        const newWallet = await db
          .insert(userWallets)
          .values({
            userId,
            totalEarnings: 0,
            availableBalance: 0,
            totalWithdrawn: 0
          })
          .returning();
        
        wallet = newWallet;
      }

      res.json(wallet[0]);
      
    } catch (error) {
      console.error("❌ Error fetching wallet:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المحفظة" });
    }
  });

  // Get wallet transactions
  app.get('/api/wallet/transactions', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(50);

      res.json(transactions);
      
    } catch (error) {
      console.error("❌ Error fetching wallet transactions:", error);
      res.status(500).json({ message: "خطأ في جلب سجل المعاملات" });
    }
  });

  // Withdraw earnings to points
  app.post('/api/wallet/withdraw', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "مبلغ غير صحيح للسحب" });
      }

      // Get current wallet
      const wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId))
        .limit(1);

      if (!wallet.length) {
        return res.status(404).json({ message: "المحفظة غير موجودة" });
      }

      const currentWallet = wallet[0];

      if (amount > currentWallet.availableBalance) {
        return res.status(400).json({ message: "رصيد غير كافي للسحب" });
      }

      // Update wallet - reduce available balance, increase withdrawn
      await db
        .update(userWallets)
        .set({
          availableBalance: currentWallet.availableBalance - amount,
          totalWithdrawn: currentWallet.totalWithdrawn + amount,
          updatedAt: new Date()
        })
        .where(eq(userWallets.userId, userId));

      // Add points to user's regular points
      const user = await db
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length) {
        await db
          .update(users)
          .set({ points: user[0].points + amount })
          .where(eq(users.id, userId));
      }

      // Record withdrawal transaction
      await db
        .insert(walletTransactions)
        .values({
          userId,
          amount: -amount,
          type: 'withdrawal',
          description: `سحب أرباح إلى نقاط LaaBoBo - ${amount} نقطة`
        });

      console.log(`✅ User ${userId} withdrew ${amount} points from wallet`);
      
      res.json({ 
        message: "تم السحب بنجاح",
        withdrawnAmount: amount,
        newBalance: currentWallet.availableBalance - amount
      });
      
    } catch (error) {
      console.error("❌ Error processing withdrawal:", error);
      res.status(500).json({ message: "خطأ في معالجة السحب" });
    }
  });

  // Process gift earnings (40% to receiver's wallet)
  app.post('/api/wallet/process-gift-earnings', requireAuth, async (req: any, res) => {
    try {
      const { giftId, receiverId, giftAmount } = req.body;

      if (!giftId || !receiverId || !giftAmount) {
        return res.status(400).json({ message: "بيانات ناقصة" });
      }

      // Calculate 40% earnings
      const earningsAmount = Math.floor(giftAmount * 0.4);

      if (earningsAmount <= 0) {
        return res.json({ message: "لا توجد أرباح لهذه الهدية" });
      }

      // Get or create receiver's wallet
      let wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, receiverId))
        .limit(1);

      if (!wallet.length) {
        const newWallet = await db
          .insert(userWallets)
          .values({
            userId: receiverId,
            totalEarnings: earningsAmount,
            availableBalance: earningsAmount,
            totalWithdrawn: 0
          })
          .returning();
        
        wallet = newWallet;
      } else {
        // Update existing wallet
        await db
          .update(userWallets)
          .set({
            totalEarnings: wallet[0].totalEarnings + earningsAmount,
            availableBalance: wallet[0].availableBalance + earningsAmount,
            updatedAt: new Date()
          })
          .where(eq(userWallets.userId, receiverId));
      }

      // Record earnings transaction
      await db
        .insert(walletTransactions)
        .values({
          userId: receiverId,
          amount: earningsAmount,
          type: 'gift_earning',
          description: `أرباح من هدية (40%) - ${earningsAmount} نقطة`,
          giftId: giftId
        });

      console.log(`✅ User ${receiverId} earned ${earningsAmount} points (40% of ${giftAmount}) from gift ${giftId}`);
      
      res.json({
        message: "تم إضافة الأرباح للمحفظة",
        earningsAmount,
        percentage: 40
      });
      
    } catch (error) {
      console.error("❌ Error processing gift earnings:", error);
      res.status(500).json({ message: "خطأ في معالجة أرباح الهدية" });
    }
  });

  console.log("✅ Wallet routes configured");
}