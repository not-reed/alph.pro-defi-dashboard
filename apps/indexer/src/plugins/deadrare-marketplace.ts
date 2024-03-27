// NGU: '21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu
// http://10.11.12.13:9090/contracts/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu/parent
// http://10.11.12.13:9090/contract-events/contract-address/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu?page=1&limit=100
// Ayin Factory: 'vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R'
// http://10.11.12.13:9090/contracts/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R/sub-contracts?page=1&limit=100
// http://10.11.12.13:9090/contract-events/contract-address/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R?page=1&limit=100
import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewDeadRareListing } from "../database/schemas/public/DeadRareListing";
import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";
import type { TransactionHash } from "../services/common/types/brands";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

const DEADRARE_MARKETPLACE = "xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF";

interface PluginData {
  listings: NewDeadRareListing[];
  transactions: NewPluginBlock[];
}

export class DeadRareMarketplacePlugin extends Plugin<PluginData> {
  PLUGIN_NAME = "deadrare-marketplace";

  async process(blocks: Block[]) {
    const listings = new Map<bigint, NewDeadRareListing>();
    const processedTransactions = new Set<TransactionHash>();

    const prevListingIds = blocks.flatMap((block) =>
      block.transactions.flatMap((transaction) => {
        if (!transaction.events?.length) {
          return [];
        }
        return transaction.events.flatMap((event) => {
          if (event.contractAddress !== DEADRARE_MARKETPLACE) {
            return [];
          }

          if (event.eventIndex === 0) {
            const [
              _price,
              _listingId,
              _tokenId,
              _collectionId,
              _tokenOwner,
              _listingContractId,
            ] = event.fields.map((field) => field.value);
            return [BigInt(_listingId as string)];
          }
          if (event.eventIndex === 1) {
            const [
              _price,
              _listingId,
              _tokenId,
              _collectionId,
              _previousOwner,
              _newOwner,
            ] = event.fields.map((field) => field.value);
            return [BigInt(_listingId as string)];
          }
          if (event.eventIndex === 2) {
            const [_listingId, _tokenId, _collectionId, _tokenOwner] =
              event.fields.map((field) => field.value);
            return [BigInt(_listingId as string)];
          }
          if (event.eventIndex === 3) {
            const [_listingId, _tokenId, _collectionId, _oldPrice, _newPrice] =
              event.fields.map((field) => field.value);
            return [BigInt(_listingId as string)];
          }

          return [];
        });
      })
    );

    const previous = prevListingIds.length
      ? await db
          .selectFrom("DeadRareListing")
          .selectAll()
          .where("listingId", "in", Array.from(new Set(prevListingIds)))
          .execute()
      : [];

    for (const listing of previous) {
      listings.set(BigInt(listing.listingId), listing);
    }

    for (const block of blocks) {
      for (const transaction of block.transactions) {
        if (!transaction.events?.length) {
          continue;
        }
        for (const event of transaction.events) {
          if (event.contractAddress !== DEADRARE_MARKETPLACE) {
            continue;
          }

          if (event.eventIndex === 0) {
            const [
              _price,
              _listingId,
              _tokenId,
              _collectionId,
              _tokenOwner,
              _listingContractId,
            ] = event.fields.map((field) => field.value);

            processedTransactions.add(transaction.transactionHash);
            listings.set(BigInt(_listingId as string), {
              price: BigInt(_price),
              listingId: BigInt(_listingId),
              collectionAddress: addressFromContractId(_collectionId as string),
              tokenAddress: addressFromContractId(_tokenId as string),
              seller: _tokenOwner as string,
              buyer: null,
              listingAddress: addressFromContractId(
                _listingContractId as string
              ),
              listedAt: new Date(block.timestamp),
              listedTransaction: transaction.transactionHash,
              soldAt: null,
              soldTransaction: null,
              unlistedAt: null,
              unlistedTransaction: null,
            } satisfies NewDeadRareListing);
          } else if (event.eventIndex === 1) {
            const [
              _price,
              _listingId,
              _tokenId,
              _collectionId,
              _previousOwner,
              _newOwner,
            ] = event.fields.map((field) => field.value);
            const prev = listings.get(BigInt(_listingId as string));
            if (!prev) {
              throw new Error("NFTSoldNotFound");
            }

            processedTransactions.add(transaction.transactionHash);
            listings.set(BigInt(_listingId as string), {
              ...prev,
              price: BigInt(_price),
              buyer: _newOwner as string,
              soldAt: new Date(block.timestamp),
              soldTransaction: transaction.transactionHash,
            });
          } else if (event.eventIndex === 2) {
            const [_listingId, _tokenId, _collectionId, _tokenOwner] =
              event.fields.map((field) => field.value);
            const prev = listings.get(BigInt(_listingId as string));
            if (!prev) {
              throw new Error("NFTListingCancelledNotFound");
            }

            processedTransactions.add(transaction.transactionHash);
            listings.set(BigInt(_listingId as string), {
              ...prev,
              unlistedAt: new Date(block.timestamp),
              unlistedTransaction: transaction.transactionHash,
            });
          } else if (event.eventIndex === 3) {
            const [_listingId, _tokenId, _collectionId, _oldPrice, _newPrice] =
              event.fields.map((field) => field.value);

            const prev = listings.get(BigInt(_listingId as string));
            if (!prev) {
              throw new Error("NFTListingPriceUpdatedNotFound");
            }

            processedTransactions.add(transaction.transactionHash);
            listings.set(BigInt(_listingId as string), {
              ...prev,
              price: BigInt(_newPrice),
            });
          }
        }
      }
    }

    // // on LP create, load token0, token1, pair, factory
    return {
      listings: Array.from(listings.values()),
      transactions: Array.from(processedTransactions).map((hash) => ({
        blockHash: hash,
        pluginName: this.PLUGIN_NAME,
      })),
    };
  }

  // insert data
  async insert(trx: Transaction<Database>, data: PluginData) {
    await trx
      .insertInto("PluginBlock")
      .values(data.transactions) // throw on conflict
      .execute();

    await trx
      .insertInto("DeadRareListing")
      .values(data.listings)
      .onConflict((col) =>
        col.column("listingId").doUpdateSet((eb) => ({
          price: eb.ref("excluded.price"),
          buyer: eb.ref("excluded.buyer"),
          soldAt: eb.ref("excluded.soldAt"),
          soldTransaction: eb.ref("excluded.soldTransaction"),
          unlistedAt: eb.ref("excluded.unlistedAt"),
          unlistedTransaction: eb.ref("excluded.unlistedTransaction"),
        }))
      )
      .execute();
    return;
  }
}
