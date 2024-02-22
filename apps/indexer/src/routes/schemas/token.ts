import { z } from "@hono/zod-openapi";

export const TokenSchema = z
	.object({
		address: z
			.string()
			.openapi({ example: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq" }),
		id: z.string().openapi({
			example:
				"0000000000000000000000000000000000000000000000000000000000000000",
		}),
		symbol: z.string().openapi({ example: "ALPH" }),
		name: z.string().openapi({ example: "Alephium" }),
		totalSupply: z.string().openapi({ example: "0" }),
		decimals: z.number().openapi({ example: 18 }),
		logo: z
			.string()
			.openapi({
				example: "https://www.ayin.app/assets/alephium-2142ce63.svg",
			})
			.nullable(),
		description: z
			.string()
			.openapi({
				example: "The native token of the Alephium Blockchain",
			})
			.nullable(),
		verified: z.boolean().openapi({ example: true }),
	})
	.nullable()
	.openapi("Token");
