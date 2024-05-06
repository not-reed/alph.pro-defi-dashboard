import { reactive } from "vue";
import { usePrices } from "./usePrices";
interface Social {
	name: string;
	github: string | null;
	discord: string | null;
	twitter: string | null;
	telegram: string | null;
	website: string | null;
	medium: string | null;
}

interface Token {
	address: string;
	name: string;
	symbol: string;
	decimals: number;
	listed: boolean;
	description: string;
	logo: string;

	// id: string; // missing
	social: Social | null; // missing on nested structures
}
export interface TokenBalance {
	userAddress: string;
	balance: bigint;
	token: Token;
}

export interface NftBalance {
	userAddress: string;
	balance: bigint;
	nft: {
		address: string;
		description: string;
		image: string;
		name: string;
		nftIndex: number;
		attributes: { key: string; value: string }[];
		collection: {
			address: string;
			uri: string;
			image: string;
			name: string;
			description: string;
			listed: boolean;
			social: Social | null;
			floor: bigint;
		};
	};
}

export interface PoolBalance {
	userAddress: string;
	balance: bigint;
	pool: {
		factory: string;
		amount0: bigint;
		amount1: bigint;
		totalSupply: string;
		pair: Token;
		token0: Token;
		token1: Token;
	};
}

interface FarmBalanceSingle {
	userAddress: string;
	balance: bigint;
	single: Token;
	pool: null;
}

interface FarmBalancePool {
	userAddress: string;
	balance: bigint;
	single: null;
	pool: {
		factory: string;
		amount0: bigint;
		amount1: bigint;
		totalSupply: bigint;
		pair: Token;
		token0: Token;
		token1: Token;
	};
}

export type FarmBalance = FarmBalanceSingle | FarmBalancePool;

const EMPTY_USER = () => ({
	//
	wallet: "",
	walletLoaded: false,
	tokens: [] as TokenBalance[],
	nfts: [] as NftBalance[],
	pools: [] as PoolBalance[],
	farms: [] as FarmBalance[],
});

const user = reactive(EMPTY_USER());

interface RawBalance {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	tokens: any[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	nfts: any[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	pools: any[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	farms: any[];
}
function setBalances(balances: RawBalance) {
	user.walletLoaded = true;
	user.tokens = balances.tokens.map((t) => ({
		...t,
		balance: BigInt(t.balance),
	}));
	user.nfts = balances.nfts.map((n) => ({
		...n,
		balance: BigInt(n.balance),
		nft: {
			...n.nft,
			collection: {
				...n.nft.collection,
				floor: BigInt(n.nft.collection.floor || 0),
			},
			// floor: BigInt(n.collection.floor),
		},
	}));
	user.pools = balances.pools.map((p) => ({
		...p,
		balance: BigInt(p.balance),
		pool: {
			...p.pool,
			amount0: BigInt(p.pool.amount0),
			amount1: BigInt(p.pool.amount1),
			totalSupply: BigInt(p.pool.totalSupply),
		},
	}));
	user.farms = balances.farms.map((s) => ({
		...s,
		balance: BigInt(s.balance),
		single: s.single,
		pool: s.pool && {
			...s.pool,
			amount0: BigInt(s.pool.amount0),
			amount1: BigInt(s.pool.amount1),
			totalSupply: BigInt(s.pool.totalSupply),
		},
	}));
}

async function loadBalances(wallet: string) {
	if (!wallet) {
		setBalances({ tokens: [], nfts: [], pools: [], farms: [] });
		return;
	}

	const { updatePrices } = usePrices();
	//TODO: if user is logged in with discord, load all saved wallets + connected/requested wallet
	// if the user is not logged in with discord, only load connected/requested wallet

	// pass array to make multiple wallets easier later
	const query = new URLSearchParams({ address: [wallet].join(",") });
	const url = `${import.meta.env.VITE_API_ENDPOINT}/api/v2/balances?${query}`;
	const data = await fetch(url).then((a) => a.json());

	const tokens = data.tokens
		.reduce(
			(acc: string[], balance: TokenBalance) =>
				acc.concat(balance.token.address),
			[],
		)
		.concat(
			data.pools.reduce(
				(acc: string[], p: PoolBalance) =>
					acc.concat(p.pool.token0.address, p.pool.token1.address),
				[],
			),
		)
		.concat(
			data.farms.reduce((acc: string[], f: FarmBalance) => {
				if (f.pool) {
					return acc.concat(f.pool.token0.address, f.pool.token1.address);
				}
				return f.single.address;
			}, []),
		);

	await updatePrices(Array.from(new Set(tokens)));
	setBalances(data);
}

async function refreshWallet(wallet: string) {
	const params = new URLSearchParams();
	params.set("address", wallet);

	const url = `${
		import.meta.env.VITE_API_ENDPOINT
	}/api/balances/fix?${params.toString()}`;

	const data = await fetch(url, {
		method: "POST",
		credentials: "include",
	}).then((a) => a.json());

	if (data.success) {
		await loadBalances(wallet);
	}
}

function setWallet(wallet: string) {
	user.walletLoaded = false;
	user.wallet = wallet;
}

function resetUser() {
	Object.assign(user, EMPTY_USER());
}

export function useUser() {
	return {
		user,
		setWallet,
		setBalances,
		resetUser,
		loadBalances,
		refreshWallet,
	};
}
