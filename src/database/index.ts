import { AppDataSource } from "./data-source";

import { User } from "./entities/User.entity";
import { Statistic } from "./entities/Statistic.entity";
import { Cursor } from "./entities/Cursor.entity";
import { Logger } from "tslog";

const log = new Logger();

export async function connect(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    log.info("Connecting to Postgres...");
    await AppDataSource.initialize();
  }
}

export async function disconnect(): Promise<void> {
  if (AppDataSource.isInitialized) {
    log.info("Disconnecting from Postgres...");
    await AppDataSource.destroy();
  }
}

export { User, Statistic, Cursor };

export default AppDataSource;
