import { type Env, Hono, type Schema } from 'hono'

const app = new Hono<Env, Schema, '/api/status'>()

app.get('/', (c) => c.json({ status: 'ok'}))

export default app
