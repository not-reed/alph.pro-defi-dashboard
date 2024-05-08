import {
	type RouteRecordRaw,
	createRouter,
	createWebHistory,
	type RouteRecordName,
} from "vue-router";
import NProgress from "nprogress";
import type { icons } from "./utils/icons";
import { useUser } from "./hooks/useUser";
import { useDiscordAccount } from "./hooks/useDiscordAccount";
import Api from "./pages/Api.vue";

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
	{
		path: "/",
		name: "Home",
		component: () => import("./pages/Home.vue"),
		meta: { hide: true },
	},
	{
		path: "/portfolio",
		name: "Portfolio",
		component: () => import("./pages/PageShell.vue"),
		meta: { title: "Portfolio", defaultOpen: true },
		children: [
			{
				path: "/portfolio/overview/:address?",
				name: "PortfolioOverview",
				component: () => import("./pages/Portfolio/Overview.vue"),
				meta: {
					title: "Overview",
					icon: "home",
					needsWallet: true,
				},
			},
			// {
			// 	path: "/portfolio/wallet",
			// 	name: "PortfolioWallet",
			// 	component: PortfolioWalletVue,
			// 	meta: {
			// 		title: "Wallet",
			// 		icon: "wallet",
			// 		needsWallet: true,
			// 		disabled: true,
			// 	},
			// },
			// {
			// 	path: "/portfolio/defi",
			// 	name: "PortfolioDeFi",
			// 	component: PortfolioDeFiVue,
			// 	meta: {
			// 		title: "DeFi",
			// 		icon: "banknotes",
			// 		needsWallet: true,
			// 		disabled: true,
			// 	},
			// },
		],
	},
	{
		path: "/defi",
		name: "DeFi",
		component: () => import("./pages/PageShell.vue"),
		meta: { defaultOpen: true },
		children: [
			{
				path: "/defi/liquidity-pools",
				name: "Liquidity Pools",
				component: () => import("./pages/DeFi/LiquidityPools.vue"),
				meta: { title: "Liquidity Pools" },
			},
			{
				path: "/defi/swaps",
				name: "Swaps",
				component: () => import("./pages/DeFi/Swaps.vue"),
				meta: { title: "Live Swaps" },
			},
			{
				path: "/defi/fresh-liquidity",
				name: "Fresh Liquidity",
				component: () => import("./pages/Tokens/FreshLiquidity.vue"),
				meta: { title: "Fresh Liquidity" },
			},
			// {
			// 	path: "/defi/opportunities",
			// 	name: "Opportunities",
			// 	component: OpportunitiesVue,
			// 	meta: { title: "Opportunities", icon: "currency", disabled: true },
			// },
		],
	},
	{
		path: "/tokens",
		name: "Tokens",
		component: () => import("./pages/PageShell.vue"),
		meta: { defaultOpen: true },
		children: [
			// {
			// 	path: "/tokens/verified",
			// 	name: "Listed Tokens",
			// 	component: () => import("./pages/Tokens/VerifiedTokens.vue"),
			// 	meta: { title: "Listed Tokens", hide: true }, // TODO: remove, only left to not break bookmarks, should be redirect
			// },
			// {
			// 	path: "/tokens/unverified",
			// 	name: "Unlisted Tokens",
			// 	component: () => import("./pages/Tokens/UnverifiedTokens.vue"),
			// 	meta: { title: "Unlisted Tokens", hide: true }, // TODO: remove, only left to not break bookmarks, should be redirect
			// },

			{
				path: "/tokens/listed",
				name: "Listed Tokens",
				component: () => import("./pages/Tokens/VerifiedTokens.vue"),
				meta: { title: "Listed Tokens" },
			},
			{
				path: "/tokens/unlisted",
				name: "Unlisted Tokens",
				component: () => import("./pages/Tokens/UnverifiedTokens.vue"),
				meta: { title: "Unlisted Tokens" },
			},
			{
				path: "/tokens/holders/:address?",
				name: "Token Holders",
				component: () => import("./pages/Tokens/Holders.vue"),
				meta: { title: "Top Holders" },
			},
			// {
			// 	path: "/tokens/hot",
			// 	name: "Hot Tokens",
			// 	component: HotTokensVue,
			// 	meta: { title: "Hot Tokens", disabled: true },
			// },
		],
	},
	{
		path: "/nfts",
		name: "NFTs",
		component: () => import("./pages/PageShell.vue"),
		meta: { defaultOpen: true },
		children: [
			// {
			// 	path: "/nfts/new",
			// 	name: "New NFTs",
			// 	component: () => import("./pages/NFTs/ListedNFTs.vue"),
			// 	meta: { title: "nfts NFTs", hide: true },
			// },
			{
				path: "/nfts/listed",
				name: "Listed NFTs",
				component: () => import("./pages/NFTs/ListedNFTs.vue"),
				meta: { title: "Listed NFTs" },
			},
			{
				path: "/nfts/unlisted",
				name: "Unlisted NFTs",
				component: () => import("./pages/NFTs/UnlistedNFTs.vue"),
				meta: { title: "Unlisted NFTs" },
			},
			{
				path: "/nfts/holders",
				name: "Nft Holders",
				component: () => import("./pages/NFTs/NftHolders.vue"),
				meta: { title: "Holders" },
			},
			// {
			// 	path: "/nfts/hot",
			// 	name: "Hot NFTs",
			// 	component: HotNFTsVue,
			// 	meta: { title: "Hot NFTs", disabled: true },
			// },
			// {
			// 	path: "/nfts/minting",
			// 	name: "Minting",
			// 	component: MintingVue,
			// 	meta: { title: "Minting", disabled: true },
			// },
		],
	},

	{
		path: "/",
		name: "More",
		component: () => import("./pages/PageShell.vue"),
		children: [
			{
				path: "https://twitter.com/alphdotpro",
				name: "Twitter",
				component: () => import("./pages/Home.vue"),
			},
			{
				path: "https://discord.gg/pfcR8EQZjb",
				name: "Discord",
				component: () => import("./pages/Home.vue"),
			},
			{
				path: "https://github.com/not-reed/alph.pro-defi-dashboard",
				name: "Github",
				component: () => import("./pages/Home.vue"),
			},
			{ path: "/api", name: "API", component: Api },
			{
				path: "/pricing",
				name: "Pricing",
				component: () => import("./pages/Pricing.vue"),
			},
			{
				path: "/settings",
				name: "Settings",
				component: () => import("./pages/UserSettings.vue"),
				meta: { title: "Settings", needsDiscord: true },
			},
		],
	},
	{
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: () => import("./pages/Home.vue"),
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
