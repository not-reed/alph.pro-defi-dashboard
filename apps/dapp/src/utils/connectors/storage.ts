import { ConnectionOptions } from "./types";
import { ConnectorId } from "./constants";

function getStorage() {
	return (
		globalThis.window?.localStorage ?? {
			getItem: () => undefined,
			setItem: () => undefined,
			removeItem: () => undefined,
		}
	);
}

export enum StorageKeys {
	LastUsedConnectorId = "lastUsedConnectorId",
	LastUsedConnectionOptions = "lastUsedConnectionOptions",
}
//

// biome-ignore lint/complexity/noStaticOnlyClass: Needed to overload static methods
export class Storage {
	static get(
		key: StorageKeys.LastUsedConnectionOptions,
	): Pick<ConnectionOptions, "networkId" | "addressGroup" | "keyType">;
	static get(key: StorageKeys.LastUsedConnectorId): ConnectorId;
	static get(key: StorageKeys) {
		try {
			const storage = getStorage();
			const raw = storage.getItem(`alephium:${key}`);
			return raw === null ? undefined : JSON.parse(raw);
		} catch {
			console.warn(
				`Un-Serializable value for key ${key} - removing from storage`,
			);
			Storage.remove(key);
		}
	}

	static set(
		key: StorageKeys.LastUsedConnectionOptions,
		value: Pick<ConnectionOptions, "networkId" | "addressGroup" | "keyType">,
	): void;
	static set(key: StorageKeys.LastUsedConnectorId, value: ConnectorId): void;
	static set(key: StorageKeys, value: unknown): void {
		const storage = getStorage();
		storage.setItem(`alephium:${key}`, JSON.stringify(value));
	}

	static remove(key: StorageKeys) {
		const storage = getStorage();
		storage.removeItem(`alephium:${key}`);
	}
}
