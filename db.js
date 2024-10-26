import pg from "pg";
import env from "dotenv";
env.config();

if (!process.env.PG_USER || !process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_PASSWORD || !process.env.PG_PORT) {
    throw Error("Missing PostgreSQL config env variables");
}

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

try {
    db.connect();
    console.log("Connected to the database successfully");
} catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
}

export const query = (text, params) => db.query(text, params);