import { MongoClient } from "mongodb";
import settings from "../settings.json";

async function testConnection() {
    try {
        const client = new MongoClient(settings.mongo);
        await client.connect();
        console.log("Connected to MongoDB successfully!");
        
        const db = client.db();
        console.log("Database name:", db.databaseName);
        
        // Test creating a collection and inserting a test document
        const testCollection = db.collection("test");
        const result = await testCollection.insertOne({ test: "connection", timestamp: new Date() });
        console.log("Test document inserted with ID:", result.insertedId);
        
        // Clean up the test document
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log("Test document cleaned up");
        
        await client.close();
        console.log("MongoDB connection test completed successfully!");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

testConnection();