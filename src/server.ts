import { Hono } from 'hono'

import api from './routes/api'


export function server() {
    const app = new Hono()

    app.route('/api', api)

    return app;
}
