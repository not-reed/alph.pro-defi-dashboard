import {
	type RouteRecordRaw,
	createRouter,
	createWebHistory,
	type RouteRecordName,
} from "vue-router";
import NProgress from "nprogress";
import Home from "./pages/Home.vue";
import PortfolioOverviewVue from "./pages/Portfolio/Overview.vue";
import PortfolioWalletVue from "./pages/Portfolio/Wallet.vue";
import PortfolioDeFiVue from "./pages/Portfolio/DeFi.vue";
import MintingVue from "./pages/NFTs/Minting.vue";
import HotNFTsVue from "./pages/NFTs/HotNFTs.vue";

import FreshLiquidityVue from "./pages/Tokens/FreshLiquidity.vue";
import HotTokensVue from "./pages/Tokens/HotTokens.vue";
import LiquidityPoolsVue from "./pages/DeFi/LiquidityPools.vue";
import SwapsVue from "./pages/DeFi/Swaps.vue";
import OpportunitiesVue from "./pages/DeFi/Opportunities.vue";
import UserSettingsVue from "./pages/UserSettings.vue";

import type { icons } from "./utils/icons";
import { useUser } from "./hooks/useUser";
import { useDiscordAccount } from "./hooks/useDiscordAccount";
import HoldersVue from "./pages/Tokens/Holders.vue";
import NftHoldersVue from "./pages/NFTs/NftHolders.vue";
import PageShellVue from "./pages/PageShell.vue";
import VerifiedTokens from "./pages/Tokens/VerifiedTokens.vue";
import UnverifiedTokens from "./pages/Tokens/UnverifiedTokens.vue";
import ListedNFTs from "./pages/NFTs/ListedNFTs.vue";
import UnlistedNFTs from "./pages/NFTs/UnlistedNFTs.vue";

const { loadBalances, user } = useUser();
declare module "vue-router" {
	interface RouteMeta {
		title?: string;
		icon?: keyof typeof icons;
		defaultOpen?: boolean;
		needsWallet?: boolean;
		needsDiscord?: boolean;
	}
}

export const routes = [
	{ path: "/", name: "Home", component: Home, meta: { hide: true } },
	{
		path: "/portfolio",
		name: "Portfolio",
		component: PageShellVue,
		meta: { title: "Portfolio", defaultOpen: true },
		children: [
			{
				path: "/portfolio/overview/:address?",
				name: "PortfolioOverview",
				component: PortfolioOverviewVue,
				meta: {
					title: "Overview",
					icon: "home",
					needsWallet: true,
				},
			},
			{
				path: "/portfolio/wallet",
				name: "PortfolioWallet",
				component: PortfolioWalletVue,
				meta: {
					title: "Wallet",
					icon: "wallet",
					needsWallet: true,
					disabled: true,
				},
			},
			{
				path: "/portfolio/defi",
				name: "PortfolioDeFi",
				component: PortfolioDeFiVue,
				meta: {
					title: "DeFi",
					icon: "banknotes",
					needsWallet: true,
					disabled: true,
				},
			},
		],
	},
	{
		path: "/defi",
		name: "DeFi",
		component: PageShellVue,
		meta: { defaultOpen: true },
		children: [
			{
				path: "/defi/liquidity-pools",
				name: "Liquidity Pools",
				component: LiquidityPoolsVue,
				meta: { title: "Liquidity Pools" },
			},
			{
				path: "/defi/swaps",
				name: "Swaps",
				component: SwapsVue,
				meta: { title: "Swaps", disabled: true },
			},
			{
				path: "/defi/opportunities",
				name: "Opportunities",
				component: OpportunitiesVue,
				meta: { title: "Opportunities", icon: "currency", disabled: true },
			},
		],
	},
	{
		path: "/tokens",
		name: "Tokens",
		component: PageShellVue,
		meta: { defaultOpen: true },
		children: [
			{
				path: "/tokens/verified",
				name: "Listed Tokens",
				component: VerifiedTokens,
				meta: { title: "Listed Tokens", hide: true }, // TODO: remove, only left to not break bookmarks, should be redirect
			},
			{
				path: "/tokens/unverified",
				name: "Unlisted Tokens",
				component: UnverifiedTokens,
				meta: { title: "Unlisted Tokens", hide: true }, // TODO: remove, only left to not break bookmarks, should be redirect
			},

			{
				path: "/tokens/listed",
				name: "Listed Tokens",
				component: VerifiedTokens,
				meta: { title: "Listed Tokens" },
			},
			{
				path: "/tokens/unlisted",
				name: "Unlisted Tokens",
				component: UnverifiedTokens,
				meta: { title: "Unlisted Tokens" },
			},
			{
				path: "/tokens/holders/:address?",
				name: "Token Holders",
				component: HoldersVue,
				meta: { title: "Top Holders" },
			},
			{
				path: "/tokens/hot",
				name: "Hot Tokens",
				component: HotTokensVue,
				meta: { title: "Hot Tokens", disabled: true },
			},
			{
				path: "/tokens/fresh-liquidity",
				name: "Fresh Liquidity",
				component: FreshLiquidityVue,
				meta: { title: "Fresh Liquidity", disabled: true },
			},
		],
	},
	{
		path: "/nfts",
		name: "NFTs",
		component: PageShellVue,
		meta: { defaultOpen: true },
		children: [
			{
				path: "/nfts/new",
				name: "New NFTs",
				component: ListedNFTs,
				meta: { title: "nfts NFTs", hide: true },
			},
			{
				path: "/nfts/listed",
				name: "Listed NFTs",
				component: ListedNFTs,
				meta: { title: "Listed NFTs" },
			},
			{
				path: "/nfts/unlisted",
				name: "Unlisted NFTs",
				component: UnlistedNFTs,
				meta: { title: "Unlisted NFTs" },
			},
			{
				path: "/nfts/holders",
				name: "Nft Holders",
				component: NftHoldersVue,
				meta: { title: "Holders" },
			},
			{
				path: "/nfts/hot",
				name: "Hot NFTs",
				component: HotNFTsVue,
				meta: { title: "Hot NFTs", disabled: true },
			},
			{
				path: "/nfts/minting",
				name: "Minting",
				component: MintingVue,
				meta: { title: "Minting", disabled: true },
			},
		],
	},

	{
		path: "/",
		name: "More",
		component: PageShellVue,
		children: [
			{
				path: "https://twitter.com/alphdotpro",
				name: "Twitter",
				component: Home,
			},
			{
				path: "https://discord.gg/pfcR8EQZjb",
				name: "Discord",
				component: Home,
			},
			{ path: "/", name: "Github", component: Home, meta: { disabled: true } },
			{ path: "/", name: "Docs", component: Home, meta: { disabled: true } },
			{ path: "/", name: "API", component: Home, meta: { disabled: true } },
			{
				path: "/",
				name: "Brand Kit",
				component: Home,
				meta: { disabled: true },
			},
			{
				path: "/settings",
				name: "Settings",
				component: UserSettingsVue,
				meta: { title: "Settings", needsDiscord: true },
			},
		],
	},
	{
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: Home,
		meta: { hide: true },
	},
] satisfies Readonly<RouteRecordRaw[]>;

export const router = createRouter({
	history: createWebHistory(),
	routes,
});

// used for guards & prefetching data
const { session, loadSession, setLoaded } = useDiscordAccount();

router.beforeEach(async (to, _from) => {
	NProgress.start();

	if (to.meta.needsWallet) {
		const addressParam = Array.isArray(to.params.address)
			? to.params.address[0]
			: to.params.address;

		if (!addressParam && !user.wallet) {
			// no usable wallet in link
			return "/";
		}

		if (!addressParam && user.wallet) {
			// redirect to default wallet
			await loadBalances(user.wallet);
			return {
				name: to.name as RouteRecordName,
				params: { address: user.wallet },
			};
		}

		await loadBalances(addressParam);

		// redirect to use users default wallet
	}

	if (to.meta.needsDiscord && !session?.loaded) {
		try {
			await loadSession();
		} catch {
			setLoaded();
		}
	}

	if (to.meta.needsDiscord && !session?.user?.name) {
		return "/";
	}
});

router.afterEach(() => {
	// Complete the animation of the route progress bar.
	NProgress.done();
});
