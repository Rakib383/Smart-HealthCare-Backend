import { envVars } from "../config/env";
import { createClient, RedisClientType } from "redis";

class RedisService {

    private client: RedisClientType | null = null;
    private isConnected: boolean = false;

    async connect(): Promise<void> {

        try {

            this.client = createClient({
                url: envVars.REDIS_URL,
            });

            this.client.on("error", (err) => {
                console.error("Redis Client Error", err);
                this.isConnected = false;
            });

            this.client.on("connect", () => {
                console.log("Redis client connected");
                this.isConnected = true;
            });

            this.client.on("ready", () => {
                console.log("Redis client ready");
                this.isConnected = true;
            });

            this.client.on("end", () => {
                console.log("Redis client disconnected");
                this.isConnected = false;
            });

            this.client.on("reconnecting", () => {
                console.log("Redis client reconnecting");
                this.isConnected = false;
            });

            await this.client.connect();

        } catch (error) {
            console.log(error);
            this.isConnected = false;

        }
    }

    private ensureConnection(): RedisClientType {
        if (!this.client) {
            throw new Error("Redis client is not initialized. Call connect() first.");
        }

        if (!this.isConnected) {
            throw new Error("Redis client is not connected.");
        }
        return this.client;
    }

    async get(key: string): Promise<string | null> {
        try {
            const client = this.ensureConnection();
            return await client.get(key);

        } catch (error) {
            console.error("Error occurred while fetching data from Redis:", error);
            throw error;
        }
    }

    async set(key: string, value: string, ttlInSeconds?: number): Promise<void> {
        try {
            const client = this.ensureConnection();
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            await client.set(key, stringValue, { EX: ttlInSeconds });

        } catch (error) {
            console.error("Error occurred while setting data in Redis:", error);
            throw error;
        }
    }

    async update(key: string, value: string, ttlInSeconds?: number): Promise<void> {
        await this.set(key, value, ttlInSeconds);
    }

    async delete(key: string): Promise<void> {
        try {
            const client = this.ensureConnection();
            await client.del(key);
        }

        catch (error) {
            console.error("Error occurred while deleting data from Redis:", error);
            throw error;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const client = this.ensureConnection();
            await client.ping();
            return true;
        } catch (error) {
            console.error("Redis is not available:", error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
    
}

export const redisService = new RedisService();