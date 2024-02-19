import { readdir } from "node:fs/promises";
import { join } from "node:path";

import type { Block } from "../services/sdk/types/block";
import { Plugin } from "../common/plugins/abstract";

import { db } from "../database/db";

export async function loadPlugins(): Promise<Plugin<unknown>[]> {
	const files = await getFiles(join(__dirname, "../plugins"));
	if (!files?.length) {
		return [];
	}
	const plugins = await Promise.all(
		files?.map(async (file) => await import(file)),
	);

	return plugins.reduce((acc, cur) => {
		try {
			const instances: Plugin<unknown>[] = [];
			for (const key of Object.keys(cur)) {
				try {
					const tmp = new cur[key]();
					if (tmp instanceof Plugin) {
						instances.push(tmp);
					}
				} catch {}
			}
			return acc.concat(instances);
		} catch {
			return acc;
		}
	}, []);
}

async function getFiles(directoryPath: string) {
	try {
		const fileNames = await readdir(directoryPath); // returns a JS array of just short/local file-names, not paths.
		const filePaths = fileNames.map((fn) => join(directoryPath, fn));
		return filePaths;
	} catch (err) {
		console.error(err); // depending on your application, this `catch` block (as-is) may be inappropriate; consider instead, either not-catching and/or re-throwing a new Error with the previous err attached.
	}
}

export async function filterUnprocessedBlocks(
	pluginName: string,
	blocks: Block[],
) {
	const processedBlocks = new Set(
		await db
			.selectFrom("PluginBlock")
			.select("blockHash")
			.where("pluginName", "=", pluginName)
			.where(
				"blockHash",
				"in",
				blocks.map((b) => b.blockHash),
			)
			.execute()
			.then((res) => res.map((r) => r.blockHash)),
	);

	return blocks.filter((b) => !processedBlocks.has(b.blockHash));
}
