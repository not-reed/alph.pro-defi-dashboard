import type { FC } from "hono/jsx";
import { Layout, theme } from "./layout";

export const IndexerStatus: FC = () => {
	return (
		<Layout>
			<header class="font-thin text-6xl text-center p-16">
				<h1 class="">Alph.Pro</h1>
			</header>

			<section>
				<h2 class="text-3xl text-center">Indexer Statuses</h2>
				<ul x-data class="w-full max-w-2xl mx-auto flex flex-col gap-2">
					<template x-for="plugin in $store.plugins.forDisplay">
						<li
							class="px-4 py-1 w-full shadow border "
							x-bind:class={`{ 'opacity-50': plugin.status !== 'Active', 'border-red-500': plugin.isBackfilling && plugin.status === 'Active', 'border-[${theme.calypso[
								"800"
							].replaceAll(
								" ",
								"_",
							)}]': !plugin.isBackfilling || plugin.status !== 'Active' }`}
							style={`background: ${theme.calypso["800"]}`}
						>
							<div x-text="plugin.name" class="font-bold uppercase" />
							<div class="flex gap-4">
								<div>Genesis</div>
								<input
									x-data
									class="flex-1"
									type="range"
									disabled
									x-bind:min="plugin.start"
									x-bind:max="plugin.end"
									x-model="plugin.current"
								/>
								<div>Now</div>
							</div>

							<div class="flex justify-between flex-col">
								<div class="flex">
									<div class="w-32">Indexed To:</div>
									<div x-html="plugin.currentDate" />
								</div>
							</div>
						</li>
					</template>
				</ul>
			</section>
		</Layout>
	);
};
