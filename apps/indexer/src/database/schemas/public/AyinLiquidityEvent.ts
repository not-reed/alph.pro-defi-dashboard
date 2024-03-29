// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';

/** Identifier type for public.AyinLiquidityEvent */
export type AyinLiquidityEventId = string & { __brand: 'AyinLiquidityEventId' };

/** Represents the table public.AyinLiquidityEvent */
export default interface AyinLiquidityEventTable {
  id: ColumnType<AyinLiquidityEventId, AyinLiquidityEventId | undefined, AyinLiquidityEventId>;

  userAddress: ColumnType<string, string, string>;

  pairAddress: ColumnType<string, string, string>;

  amount0: ColumnType<bigint, bigint, bigint>;

  amount1: ColumnType<bigint, bigint, bigint>;

  liquidity: ColumnType<bigint, bigint, bigint>;

  action: ColumnType<string, string, string>;

  timestamp: ColumnType<Date, Date | string, Date | string>;

  transactionHash: ColumnType<string, string, string>;
}

export type AyinLiquidityEvent = Selectable<AyinLiquidityEventTable>;

export type NewAyinLiquidityEvent = Insertable<AyinLiquidityEventTable>;

export type AyinLiquidityEventUpdate = Updateable<AyinLiquidityEventTable>;
