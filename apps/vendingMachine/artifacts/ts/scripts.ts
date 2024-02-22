/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  ExecutableScript,
  ExecuteScriptParams,
  ExecuteScriptResult,
  Script,
  SignerProvider,
  HexString,
} from "@alephium/web3";
import { default as MintNftScriptJson } from "../scripts/MintNft.ral.json";
import { default as ToggleMintStateScriptJson } from "../scripts/ToggleMintState.ral.json";
import { default as UpdateBaseUriScriptJson } from "../scripts/UpdateBaseUri.ral.json";
import { default as UpdateCollectionUriScriptJson } from "../scripts/UpdateCollectionUri.ral.json";
import { default as WithdrawAlphScriptJson } from "../scripts/WithdrawAlph.ral.json";
import { default as WithdrawRoyaltyScriptJson } from "../scripts/WithdrawRoyalty.ral.json";

export const MintNft = new ExecutableScript<{
  vendingMachine: HexString;
  foodTypeId: bigint;
  mintAmount: bigint;
}>(Script.fromJson(MintNftScriptJson));
export const ToggleMintState = new ExecutableScript<{
  vendingMachine: HexString;
}>(Script.fromJson(ToggleMintStateScriptJson));
export const UpdateBaseUri = new ExecutableScript<{
  vendingMachine: HexString;
  newBaseUri: HexString;
}>(Script.fromJson(UpdateBaseUriScriptJson));
export const UpdateCollectionUri = new ExecutableScript<{
  vendingMachine: HexString;
  newCollectionUri: HexString;
}>(Script.fromJson(UpdateCollectionUriScriptJson));
export const WithdrawAlph = new ExecutableScript<{
  vendingMachine: HexString;
  to: Address;
  amount: bigint;
}>(Script.fromJson(WithdrawAlphScriptJson));
export const WithdrawRoyalty = new ExecutableScript<{
  vendingMachine: HexString;
  to: Address;
  amount: bigint;
}>(Script.fromJson(WithdrawRoyaltyScriptJson));
