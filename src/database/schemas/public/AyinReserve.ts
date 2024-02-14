// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';

/** Identifier type for public.AyinReserve */
export type AyinReserveId = string & { __brand: 'AyinReserveId' };

/** Represents the table public.AyinReserve */
export default interface AyinReserveTable {
  id: ColumnType<AyinReserveId, AyinReserveId | undefined, AyinReserveId>;

  pairAddress: ColumnType<string, string, string>;

  amount0: ColumnType<bigint, bigint, bigint>;

  amount1: ColumnType<bigint, bigint, bigint>;

  totalSupply: ColumnType<bigint, bigint, bigint>;
}

export type AyinReserve = Selectable<AyinReserveTable>;

export type NewAyinReserve = Insertable<AyinReserveTable>;

export type AyinReserveUpdate = Updateable<AyinReserveTable>;
