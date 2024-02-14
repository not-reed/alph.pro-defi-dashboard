import type { FC } from "hono/jsx";
import { Layout } from "./layout";

export const IndexerStatus: FC = () => {
  return (
    <Layout>
      <header class="font-thin text-6xl text-center p-16">
        <h1 class="">Alph.Pro</h1>
      </header>

      <section>
        <h2 class="text-3xl text-center">Indexer Statuses</h2>
        <ul x-data class="w-full max-w-md mx-auto flex flex-col gap-4">
          <template x-for="plugin in $store.plugins.forDisplay">
            <li class="p-4 w-full shadow bg-zinc-100">
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
            </li>
          </template>
        </ul>
      </section>
    </Layout>
  );
};
