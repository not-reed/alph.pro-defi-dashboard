import type { Transaction } from "kysely";
import type Database from "../../database/schemas/Database";
import type { Block } from "../../services/common/types/blocks";
import type { PluginInterface } from "./interface";

export abstract class Plugin<T> implements PluginInterface<T[]> {
	abstract PLUGIN_NAME: string;
	abstract process(blocks: Block[]): Promise<T[]>;
	abstract insert(trx: Transaction<Database>, blocks: T[]): Promise<void>;
}
