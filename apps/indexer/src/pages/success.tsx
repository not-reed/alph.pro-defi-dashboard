import type { FC } from "hono/jsx";
import { Layout } from "./layout";

export const Success: FC = () => {
  return (
    <Layout>
      <header class="font-thin text-6xl text-center p-16">
        <h1 class="">Alph.Pro</h1>
      </header>

      <section x-init="window.close();">
        <h2 class="text-3xl text-center">Sign In Successful</h2>
        <p class="text-xl text-center">
          This page will automatically close in{" "}
          {/* <span x-text="time().seconds" class="text-blue-400" /> seconds. */}
        </p>
        <p class="text-lg text-center opacity-75">
          It is now safe to close this window.
        </p>
      </section>
    </Layout>
  );
};
