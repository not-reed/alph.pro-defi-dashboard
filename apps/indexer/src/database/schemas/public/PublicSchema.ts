// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type default as KyselyMigrationTable } from './KyselyMigration';
import { type default as KyselyMigrationLockTable } from './KyselyMigrationLock';
import { type default as BlockTable } from './Block';
import { type default as PluginTable } from './Plugin';
import { type default as PoolTable } from './Pool';
import { type default as TokenTable } from './Token';
import { type default as PluginBlockTable } from './PluginBlock';
import { type default as AyinLiquidityEventTable } from './AyinLiquidityEvent';
import { type default as AyinReserveTable } from './AyinReserve';
import { type default as AyinSwapTable } from './AyinSwap';
import { type default as BalanceTable } from './Balance';
import { type default as CurrentPriceTable } from './CurrentPrice';

export default interface PublicSchema {
  kysely_migration: KyselyMigrationTable;

  kysely_migration_lock: KyselyMigrationLockTable;

  Block: BlockTable;

  Plugin: PluginTable;

  Pool: PoolTable;

  Token: TokenTable;

  PluginBlock: PluginBlockTable;

  AyinLiquidityEvent: AyinLiquidityEventTable;

  AyinReserve: AyinReserveTable;

  AyinSwap: AyinSwapTable;

  Balance: BalanceTable;

  CurrentPrice: CurrentPriceTable;
}
