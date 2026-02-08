import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function startMerge() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in your environment variables");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('reputa-v3');
        const target = db.collection('final_users_v3');
        
        // المجموعات التي سنجمع منها البيانات
        const sources = ['final_users', 'userv3', 'rawdatas', 'final_users_v3'];

        console.log("🚀 البدء في توحيد البيانات إلى مجموعة final_users_v3...");

        for (const sourceName of sources) {
            const collection = db.collection(sourceName);
            const data = await collection.find({}).toArray();
            console.log(`📥 جلب ${data.length} سجل من [${sourceName}]...`);

            for (const user of data) {
                if (!user.pioneerId) continue;
                
                await target.updateOne(
                    { pioneerId: user.pioneerId },
                    { 
                        $set: {
                            pioneerId: user.pioneerId,
                            username: user.username || user.pioneerId,
                            totalReputationScore: Number(user.totalReputationScore || user.score || 0),
                            reputationLevel: Number(user.reputationLevel || 1),
                            updatedAt: new Date(),
                            lastSource: sourceName
                        }
                    },
                    { upsert: true }
                );
            }
        }
        const total = await target.countDocuments();
        console.log(`✅ اكتمل الدمج بنجاح! المجموع النهائي للمستخدمين الفريدين: ${total}`);
    } catch (error) {
        console.error("❌ حدث خطأ أثناء الدمج:", error);
    } finally {
        await client.close();
        process.exit();
    }
}
startMerge();
