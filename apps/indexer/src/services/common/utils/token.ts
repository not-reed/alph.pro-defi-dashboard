import { addressFromContractId } from "@alephium/web3";
import type { ContractAddress, UserAddress } from "../types/brands";
import type { TokenBalance } from "../types/token";
import { logger } from "../../logger";
import { ALPH_ADDRESS } from "../../../core/constants";

export function mapRawInputToTokenBalance(input: unknown): TokenBalance[] {
  if (
    !input ||
    typeof input !== "object" ||
    !("address" in input) ||
    !("attoAlphAmount" in input) ||
    typeof input.attoAlphAmount !== "string"
  ) {
    logger.error({ msg: "Invalid Input", input });
    throw new Error("Invalid input");
  }

  const tokens =
    "tokens" in input && Array.isArray(input.tokens) ? input.tokens : [];

  return [
    {
      userAddress: input.address as UserAddress,
      tokenAddress: ALPH_ADDRESS,
      amount: BigInt(input.attoAlphAmount),
    },
  ].concat(
    tokens.map((token: unknown) => {
      if (
        !token ||
        typeof token !== "object" ||
        !("id" in token) ||
        !("amount" in token) ||
        typeof token.id !== "string" ||
        typeof token.amount !== "string"
      ) {
        throw new Error(
          "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.output.tokens.token"
        );
      }

      return {
        userAddress: input.address as UserAddress,
        tokenAddress: addressFromContractId(token.id) as ContractAddress,
        amount: BigInt(token.amount),
      };
    })
  );
}
