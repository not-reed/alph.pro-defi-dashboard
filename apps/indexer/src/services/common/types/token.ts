import type { ContractAddress, UserAddress } from "./brands";

export interface TokenBalance {
	userAddress: UserAddress;
	tokenAddress: ContractAddress;
	amount: bigint;
}
