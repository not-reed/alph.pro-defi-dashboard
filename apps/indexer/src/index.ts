import { server } from "./server";
import { core } from "./core";

const app = server();

await core();

export default app;
