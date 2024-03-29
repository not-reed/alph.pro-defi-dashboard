import { Artifact } from "@alephium/web3";

type Brand<K, T> = K & { __brand: T };

// Field Types
export type U256 = Brand<`${number}`, "U256">;
export type ByteVec = Brand<string, "ByteVec">;
export type Address = Brand<string, "Address">;
export type Bool = Brand<boolean, "Bool">;
export type FieldType = "ByteVec" | "U256" | "Address" | "Bool";
export type FieldValue = U256 | ByteVec | Address | Bool;

// Hashes
export type BlockHash = Brand<string, "BlockHash">;
export type TransactionHash = Brand<string, "TransactionHash">;
export type ContractAddress = Brand<string, "ContractAddress">;
export type ContractId = Brand<string, "ContractId">;
export type UserAddress = Brand<string, "UserAddress">;
export type ChainId = Brand<0 | 1 | 2 | 3, "ChainId">;
Artifact;
