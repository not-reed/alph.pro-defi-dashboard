import { type Env, Hono, type Schema } from 'hono'
import status from './api/status'

const app = new Hono<Env, Schema, '/api'>()

app.route('/status', status)

export default app
