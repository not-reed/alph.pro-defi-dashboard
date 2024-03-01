import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import NProgress from "nprogress";
import Home from "./pages/Home.vue";
import PortfolioOverviewVue from "./pages/Portfolio/Overview.vue";
import PortfolioWalletVue from "./pages/Portfolio/Wallet.vue";
import PortfolioDeFiVue from "./pages/Portfolio/DeFi.vue";
import MintingVue from "./pages/NFTs/Minting.vue";
import HotNFTsVue from "./pages/NFTs/HotNFTs.vue";
import NewNFTsVue from "./pages/NFTs/NewNFTs.vue";
import FreshLiquidityVue from "./pages/Tokens/FreshLiquidity.vue";
import HotTokensVue from "./pages/Tokens/HotTokens.vue";
import NewTokensVue from "./pages/Tokens/NewTokens.vue";
import LiquidityPoolsVue from "./pages/DeFi/LiquidityPools.vue";
import SwapsVue from "./pages/DeFi/Swaps.vue";
import OpportunitiesVue from "./pages/DeFi/Opportunities.vue";
import UserSettingsVue from "./pages/UserSettings.vue";

import { icons } from "./utils/icons";
import { useUser } from "./hooks/useUser";
import { useDiscord } from "./hooks/useDiscord";
import HoldersVue from "./pages/Tokens/Holders.vue";
import NftHoldersVue from "./pages/NFTs/NftHolders.vue";
import PageShellVue from "./pages/PageShell.vue";

const { user, loadBalances } = useUser();
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
				path: "/portfolio/overview/:address",
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
		children: [
			{
				path: "/defi/liquidity-pools",
				name: "Liquidity Pools",
				component: LiquidityPoolsVue,
				meta: { title: "Liquidity Pools", disabled: true },
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
				path: "/tokens/new",
				name: "New Tokens",
				component: NewTokensVue,
				meta: { title: "New Tokens" },
			},
			{
				path: "/tokens/holders/:address?",
				name: "Token Holders",
				component: HoldersVue,
				meta: { title: "Holders" },
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
				component: NewNFTsVue,
				meta: { title: "New NFTs" },
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
			{ path: "https://twitter.com/aiphpro", name: "Twitter", component: Home },
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
const { session, loadSession, setLoaded } = useDiscord();

router.beforeEach(async (to, _from, next) => {
	NProgress.start();

	if (to.meta.needsWallet && to.params.address) {
		const address = Array.isArray(to.params.address)
			? to.params.address[0]
			: to.params.address;
		if (address === ":address") {
			return next("/");
		}
		await loadBalances(address);
	}

	if (to.meta.needsWallet && !to.params.address) {
		return next("/");
	}

	if (to.meta.needsDiscord && !session?.loaded) {
		try {
			await loadSession();
		} catch {
			setLoaded();
		}
	}

	if (to.meta.needsDiscord && !session?.user?.name) {
		return next("/");
	}
	return next();
});

router.afterEach(() => {
	// Complete the animation of the route progress bar.
	NProgress.done();
});
