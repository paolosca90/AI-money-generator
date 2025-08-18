import { SQLDatabase } from "encore.dev/storage/sqldb";

// userDB is the database for storing user-related data.
export const userDB = new SQLDatabase("user", {
  migrations: "./migrations",
});
