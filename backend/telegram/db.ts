import { SQLDatabase } from "encore.dev/storage/sqldb";

export const telegramDB = new SQLDatabase("telegram", {
  migrations: "./migrations",
});
