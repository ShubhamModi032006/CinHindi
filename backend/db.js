const { Pool } = require("pg");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

const pool = new Pool(dbConfig);

const initDB = async () => {
  try {
    // First connect to default 'postgres' DB to create our DB if it doesn't exist
    const defaultPool = new Pool({ ...dbConfig, database: "postgres" });
    const client = await defaultPool.connect();
    
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbConfig.database}'`);
    if (res.rowCount === 0) {
      console.log(`Database ${dbConfig.database} not found, creating it...`);
      await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database ${dbConfig.database} created!`);
    }
    client.release();
    await defaultPool.end();

    // Now connect to our actual DB and create tables
    const dbClient = await pool.connect();
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS watch_history (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        poster VARCHAR(255),
        timestamp BIGINT NOT NULL,
        UNIQUE(user_id, item_id, item_type)
      );

      CREATE TABLE IF NOT EXISTS watch_later (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        poster VARCHAR(255),
        added_at BIGINT NOT NULL,
        UNIQUE(user_id, item_id, item_type)
      );
      
      CREATE TABLE IF NOT EXISTS continue_watching (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        poster VARCHAR(255),
        season INT,
        episode INT,
        updated_at BIGINT NOT NULL,
        UNIQUE(user_id, item_id, item_type)
      );
    `);
    dbClient.release();
    console.log("Database tables initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initDB();

module.exports = pool;
