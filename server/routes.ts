import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Data migration endpoint for importing old user data as sellers
  app.post("/admin/migrate-user-to-seller", async (req, res) => {
    try {
      const { oldUserId, newUserId, userData } = req.body;
      
      if (!oldUserId || !newUserId || !userData) {
        return res.status(400).json({ 
          error: "Missing required fields: oldUserId, newUserId, userData" 
        });
      }

      // Initialize Firebase Admin if needed
      const admin = await import('firebase-admin');
      const firestore = await import('firebase-admin/firestore');
      
      if (!admin.getApps().length) {
        admin.initializeApp({
          projectId: 'yourapp-mvp'
        });
      }
      
      const adminDb = firestore.getFirestore();
      
      console.log(`🔄 Migrating user data from ${oldUserId} to seller ${newUserId}`);
      
      // Create seller document under new UID structure
      const sellerData = {
        id: newUserId,
        email: userData.email || '',
        storeName: userData.storeName || userData.name || '',
        category: userData.category || '',
        whatsappNumber: userData.whatsappNumber || userData.phone || '',
        country: userData.country || '',
        fullName: userData.fullName || userData.name || '',
        storeDescription: userData.storeDescription || '',
        businessEmail: userData.businessEmail || userData.email || '',
        city: userData.city || '',
        location: userData.location || '',
        businessType: userData.businessType || 'individual',
        currency: userData.currency || '',
        deliveryOptions: userData.deliveryOptions || [],
        paymentMethods: userData.paymentMethods || [],
        logoUrl: userData.logoUrl || '',
        bannerUrl: userData.bannerUrl || '',
        socialMedia: userData.socialMedia || {},
        preferredLanguage: userData.preferredLanguage || '',
        tags: userData.tags || [],
        operatingHours: userData.operatingHours || '',
        subscriptionPlan: userData.subscriptionPlan || 'beta-free',
        onboardingCompleted: userData.onboardingCompleted || false,
        isAdmin: userData.isAdmin || false,
        isPublic: userData.isPublic || false,
        status: userData.status || 'draft',
        createdAt: userData.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      
      // Write to sellers collection
      await adminDb.collection('sellers').doc(newUserId).set(sellerData);
      
      // Create profile link
      await adminDb.collection('profiles').doc(newUserId).set({
        sellerId: newUserId,
        updatedAt: Date.now()
      });
      
      // Copy products if they exist
      let productsCount = 0;
      try {
        const oldProductsSnapshot = await adminDb.collection('products').where('sellerId', '==', oldUserId).get();
        for (const productDoc of oldProductsSnapshot.docs) {
          const productData = productDoc.data();
          productData.sellerId = newUserId;
          productData.updatedAt = Date.now();
          await adminDb.collection('sellers').doc(newUserId).collection('products').doc(productDoc.id).set(productData);
          productsCount++;
        }
      } catch (productsError) {
        console.warn('Could not migrate products:', productsError);
      }
      
      console.log(`✅ Migration completed: ${oldUserId} → ${newUserId}`);
      
      res.json({
        success: true,
        message: `Successfully migrated user ${oldUserId} to seller ${newUserId}`,
        sellerId: newUserId,
        productsCount
      });
      
    } catch (error: any) {
      console.error('Migration failed:', error);
      res.status(500).json({ 
        error: error?.message || 'Unknown error',
        details: 'Failed to migrate user data to seller'
      });
    }
  });

  // List existing data for migration preview
  app.get("/admin/list-migration-candidates", async (req, res) => {
    try {
      const admin = await import('firebase-admin');
      const firestore = await import('firebase-admin/firestore');
      
      if (!admin.getApps().length) {
        admin.initializeApp({
          projectId: 'yourapp-mvp'
        });
      }
      
      const adminDb = firestore.getFirestore();
      
      // Look for data that might be in old collections
      const candidates: any[] = [];
      
      // Check for old user-based data patterns
      const collections = ['users', 'profiles', 'sellers'];
      for (const collectionName of collections) {
        try {
          const snapshot = await adminDb.collection(collectionName).limit(20).get();
          snapshot.docs.forEach((doc: any) => {
            const data = doc.data();
            if (data.email || data.storeName || data.name) {
              candidates.push({
                collection: collectionName,
                id: doc.id,
                preview: {
                  email: data.email,
                  name: data.name || data.storeName || data.fullName,
                  category: data.category,
                  hasProducts: !!data.products
                }
              });
            }
          });
        } catch (err: any) {
          console.warn(`Could not read collection ${collectionName}:`, err?.message || 'Unknown error');
        }
      }
      
      res.json({ candidates });
      
    } catch (error: any) {
      console.error('Failed to list migration candidates:', error);
      res.status(500).json({ error: error?.message || 'Unknown error' });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
