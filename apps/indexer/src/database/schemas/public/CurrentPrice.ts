// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';

/** Identifier type for public.CurrentPrice */
export type CurrentPriceId = string & { __brand: 'CurrentPriceId' };

/** Represents the table public.CurrentPrice */
export default interface CurrentPriceTable {
  id: ColumnType<CurrentPriceId, CurrentPriceId | undefined, CurrentPriceId>;

  address: ColumnType<string, string, string>;

  liquidity: ColumnType<bigint | null, bigint | null, bigint | null>;

  source: ColumnType<string, string, string>;

  sourceKey: ColumnType<string, string, string>;

  timestamp: ColumnType<Date, Date | string, Date | string>;

  price: ColumnType<bigint | null, bigint | null, bigint | null>;
}

export type CurrentPrice = Selectable<CurrentPriceTable>;

export type NewCurrentPrice = Insertable<CurrentPriceTable>;

export type CurrentPriceUpdate = Updateable<CurrentPriceTable>;
