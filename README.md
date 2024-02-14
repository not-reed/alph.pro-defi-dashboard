# Hackathon#1 : Alephium

**To install dependencies:**

```bash
bun install
```

**Using Docker:** will setup redis+postgres for you in the background

_If you don't want to use Docker, you have have to install redis and postgres_

```bash
bun run start:services
```

**Create database on postgres**

```bash
postgres=# CREATE DATABASE hackthon;
```

**Migrations:**

```bash
bun run migrate
```

**Start the server with hot reloading**

```bash
bun run dev
```

**Used tools (services):**

https://kysely.dev: Object-Relational Mapping

https://hono.dev: Web Server

This project was created using `bun init` in bun v1.0.25. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
