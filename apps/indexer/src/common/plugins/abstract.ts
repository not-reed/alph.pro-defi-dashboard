import type { Transaction } from "kysely";
import type Database from "../../database/schemas/Database";

import type { PluginInterface } from "./interface";
import type { Block } from "../../services/sdk/types/block";

export interface BasePluginData {
  transactions: { blockHash: string; pluginName: string }[];
}

export abstract class Plugin<T extends BasePluginData = BasePluginData>
  implements PluginInterface<T>
{
  abstract PLUGIN_NAME: string;
  startDate?: Date;
  abstract process(blocks: Block[]): Promise<T>;
  abstract insert(trx: Transaction<Database>, blocks: T): Promise<void>;
}
