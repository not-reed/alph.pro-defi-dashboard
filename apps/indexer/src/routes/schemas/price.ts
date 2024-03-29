import { z } from "@hono/zod-openapi";
import { TokenSchema } from "./token";

export const MarketSchema = z
	.object({
		price: z.number().openapi({ example: 3.51 }),
		liquidity: z.string().nullable().openapi({ example: "129582712685" }),
		source: z.string().openapi({ example: "coingecko" }),
		sourceKey: z.string().openapi({ example: "coingecko" }),
		timestamp: z.string().openapi({ example: "2024-02-23T10:40:30.294" }),
	})
	.openapi("Market");

export const PriceSchema = z
	.object({
		token: TokenSchema,
		price: z.string().openapi({ example: "3510000000000000000" }), // calculated average current price with 18 decimals
		markets: z.array(MarketSchema),
	})
	.openapi("Price");
