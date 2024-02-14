import type { Transaction } from "kysely";
import type { Block } from "../../services/common/types/blocks";
import type Database from "../../database/schemas/Database";

export interface PluginInterface<T> {
	PLUGIN_NAME: string;
	process(blocks: Block[]): Promise<T>;
	insert(trx: Transaction<Database>, blocks: T): Promise<void>;
}
