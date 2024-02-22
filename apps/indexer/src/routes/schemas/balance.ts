import { z } from "@hono/zod-openapi";
import { TokenSchema } from "./token";

export const BalanceSchema = z
	.object({
		userAddress: z
			.string()
			.openapi({ example: "1CHYuhea7uaupotv2KkSwNLaJWYeNouDp4QffhkhTxKpr" }),
		balance: z.string().openapi({ example: "1000000000000000000" }),
		token: TokenSchema,
	})
	.openapi("Balance");
