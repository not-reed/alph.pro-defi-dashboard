import type { Transaction } from "kysely";
import type { Block } from "../../services/sdk/types/block";
import type Database from "../../database/schemas/Database";

export interface PluginInterface<T> {
  PLUGIN_NAME: string;
  startDate?: Date;
  process(blocks: Block[]): Promise<T>;
  insert(trx: Transaction<Database>, blocks: T): Promise<void>;
}
