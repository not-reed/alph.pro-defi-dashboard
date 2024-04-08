import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction as KyselyTransaction } from "kysely";
import type { NewDeadRareListing } from "../database/schemas/public/DeadRareListing";
import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";
import type { TransactionHash } from "../services/common/types/brands";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { Event } from "../services/sdk/types/event";
import type { Transaction } from "../services/sdk/types/transaction";
import type { Block } from "../services/sdk/types/block";

const DEADRARE_MARKETPLACE = "xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF";

interface PluginData {
  listings: NewDeadRareListing[];
  transactions: NewPluginBlock[];
}

const skippedListings = [5036n, 5037n, 5038n, 5039n, 5040n, 5041n, 5042n];

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
            return getListingIdFromNftListedEvent(event);
          }
          if (event.eventIndex === 1) {
            return getListingIdFromNftSoldEvent(event);
          }
          if (event.eventIndex === 2) {
            return getListingIdFromNftListingCancelledEvent(event);
          }
          if (event.eventIndex === 3) {
            return getListingIdFromNftListingPriceUpdatedEvent(event);
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
            const newListing = getNewListingFromNftListedEvent(
              block,
              transaction,
              event
            );
            listings.set(
              newListing.listingId,
              newListing satisfies NewDeadRareListing
            );
            processedTransactions.add(transaction.transactionHash);
          } else if (event.eventIndex === 1) {
            const partialListing = getPartialListingFromNftSoldEvent(
              block,
              transaction,
              event
            );

            const prev = listings.get(partialListing.listingId);
            if (!prev) {
              // TODO: debug why these are missing?
              if (skippedListings.includes(partialListing.listingId)) {
                continue;
              }
              throw new Error(`NFTSoldNotFound ${partialListing.listingId}`);
            }

            listings.set(partialListing.listingId, {
              ...prev,
              price: partialListing.price,
              buyer: partialListing.buyer,
              soldAt: partialListing.soldAt,
              soldTransaction: partialListing.soldTransaction,
            });
            processedTransactions.add(transaction.transactionHash);
          } else if (event.eventIndex === 2) {
            const partial = getPartialListingFromNftListingCancelledEvent(
              block,
              transaction,
              event
            );

            const prev = listings.get(partial.listingId);
            if (!prev) {
              throw new Error(
                `NFTListingCancelledNotFound ${partial.listingId}`
              );
            }

            listings.set(partial.listingId, {
              ...prev,
              unlistedAt: partial.unlistedAt,
              unlistedTransaction: partial.unlistedTransaction,
            });
            processedTransactions.add(transaction.transactionHash);
          } else if (event.eventIndex === 3) {
            const [_listingId, _tokenId, _collectionId, _oldPrice, _newPrice] =
              event.fields.map((field) => field.value);

            const partial = getPartialListingFromNftListingPriceUpdatedEvent(
              block,
              transaction,
              event
            );

            const prev = listings.get(partial.listingId);

            if (!prev) {
              // TODO: debug why these are missing?
              if (skippedListings.includes(partial.listingId)) {
                continue;
              }
              throw new Error(
                `NFTListingPriceUpdatedNotFound ${partial.listingId}`
              );
            }

            listings.set(partial.listingId, {
              ...prev,
              price: partial.price,
            });
            processedTransactions.add(transaction.transactionHash);
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
  async insert(trx: KyselyTransaction<Database>, data: PluginData) {
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

function getListingIdFromNftListedEvent(event: Event) {
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
function getNewListingFromNftListedEvent(
  block: Block,
  transaction: Transaction,
  event: Event
) {
  const [
    _price,
    _listingId,
    _tokenId,
    _collectionId,
    _tokenOwner,
    _listingContractId,
  ] = event.fields.map((field) => field.value);

  return {
    price: BigInt(_price),
    listingId: BigInt(_listingId),
    collectionAddress: addressFromContractId(_collectionId as string),
    tokenAddress: addressFromContractId(_tokenId as string),
    seller: _tokenOwner as string,
    buyer: null,
    listingAddress: addressFromContractId(_listingContractId as string),
    listedAt: new Date(block.timestamp),
    listedTransaction: transaction.transactionHash,
    soldAt: null,
    soldTransaction: null,
    unlistedAt: null,
    unlistedTransaction: null,
  } satisfies NewDeadRareListing;
}
function getListingIdFromNftSoldEvent(event: Event) {
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

function getPartialListingFromNftSoldEvent(
  block: Block,
  transaction: Transaction,
  event: Event
) {
  const [
    _price,
    _listingId,
    _tokenId,
    _collectionId,
    _previousOwner,
    _newOwner,
  ] = event.fields.map((field) => field.value);

  return {
    listingId: BigInt(_listingId as string),
    price: BigInt(_price),
    buyer: _newOwner as string,
    soldAt: new Date(block.timestamp),
    soldTransaction: transaction.transactionHash,
  } satisfies Pick<
    NewDeadRareListing,
    "listingId" | "price" | "buyer" | "soldAt" | "soldTransaction"
  >;
}
function getListingIdFromNftListingCancelledEvent(event: Event) {
  const [_listingId, _tokenId, _collectionId, _tokenOwner] = event.fields.map(
    (field) => field.value
  );
  return [BigInt(_listingId as string)];
}

function getPartialListingFromNftListingCancelledEvent(
  block: Block,
  transaction: Transaction,
  event: Event
) {
  const [_listingId, _tokenId, _collectionId, _tokenOwner] = event.fields.map(
    (field) => field.value
  );

  return {
    listingId: BigInt(_listingId as string),
    unlistedAt: new Date(block.timestamp),
    unlistedTransaction: transaction.transactionHash,
  } satisfies Pick<
    NewDeadRareListing,
    "listingId" | "unlistedAt" | "unlistedTransaction"
  >;
}
function getListingIdFromNftListingPriceUpdatedEvent(event: Event) {
  const [_listingId, _tokenId, _collectionId, _oldPrice, _newPrice] =
    event.fields.map((field) => field.value);
  return [BigInt(_listingId as string)];
}
function getPartialListingFromNftListingPriceUpdatedEvent(
  block: Block,
  transaction: Transaction,
  event: Event
) {
  const [_listingId, _tokenId, _collectionId, _oldPrice, _newPrice] =
    event.fields.map((field) => field.value);

  return {
    listingId: BigInt(_listingId as string),
    price: BigInt(_newPrice),
  } satisfies Pick<NewDeadRareListing, "listingId" | "price">;
}
