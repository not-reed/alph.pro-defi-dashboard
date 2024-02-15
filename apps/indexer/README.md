# Hackathon #1 : Indexer

**To install dependencies:**

**QuickStart**

```bash
bun start:services
bun migrate
bun dev
```

**Start Redis & Postgres Using Docker:**

```bash
# Starts services with docker
# reads connection parameters
# from .env file
bun run start:services
```

**Alternatively if not using docker: Create database on postgres:**

_Start Redis & Postgres however you choose and create a database.
Make sure your .env file is filled before starting the app or running migrations_

```bash
postgres=# CREATE DATABASE hackathon;
```

**Run Migrations:**

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
