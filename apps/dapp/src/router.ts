import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";
import PortfolioVue from "./pages/Portfolio.vue";
import PortfolioOverviewVue from "./pages/Portfolio/Overview.vue";
import PortfolioWalletVue from "./pages/Portfolio/Wallet.vue";
import PortfolioDeFiVue from "./pages/Portfolio/DeFi.vue";
import DeFiVue from "./pages/DeFi.vue";
import TokensVue from "./pages/Tokens.vue";
import NFTsVue from "./pages/NFTs.vue";
import MintingVue from "./pages/NFTs/Minting.vue";
import HotNFTsVue from "./pages/NFTs/HotNFTs.vue";
import NewNFTsVue from "./pages/NFTs/NewNFTs.vue";
import FreshLiquidityVue from "./pages/Tokens/FreshLiquidity.vue";
import HotTokensVue from "./pages/Tokens/HotTokens.vue";
import NewTokensVue from "./pages/Tokens/NewTokens.vue";
import LiquidityPoolsVue from "./pages/DeFi/LiquidityPools.vue";
import SwapsVue from "./pages/DeFi/Swaps.vue";
import OpportunitiesVue from "./pages/DeFi/Opportunities.vue";

export const routes = [
	{ path: "/", name: "Home", component: Home },
	{
		path: "/portfolio",
		name: "Portfolio",
		component: PortfolioVue,
		children: [
			{
				path: "/portfolio/overview",
				name: "PortfolioOverview",
				component: PortfolioOverviewVue,
				meta: { title: "Overview" },
			},
			{
				path: "/portfolio/wallet",
				name: "PortfolioWallet",
				component: PortfolioWalletVue,
				meta: { title: "Wallet" },
			},
			{
				path: "/portfolio/defi",
				name: "PortfolioDeFi",
				component: PortfolioDeFiVue,
				meta: { title: "DeFi" },
			},
		],
	},
	{
		path: "/defi",
		name: "DeFi",
		component: DeFiVue,
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
				meta: { title: "Swaps" },
			},
			{
				path: "/defi/opportunities",
				name: "Opportunities",
				component: OpportunitiesVue,
				meta: { title: "Opportunities" },
			},
		],
	},
	{
		path: "/tokens",
		name: "Tokens",
		component: TokensVue,
		children: [
			{
				path: "/tokens/new",
				name: "New Tokens",
				component: NewTokensVue,
				meta: { title: "New Tokens" },
			},
			{
				path: "/tokens/hot",
				name: "Hot Tokens",
				component: HotTokensVue,
				meta: { title: "Hot Tokens" },
			},
			{
				path: "/tokens/fresh-liquidity",
				name: "Fresh Liquidity",
				component: FreshLiquidityVue,
				meta: { title: "Fresh Liquidity" },
			},
		],
	},
	{
		path: "/nfts",
		name: "NFTs",
		component: NFTsVue,
		children: [
			{
				path: "/nfts/new",
				name: "New NFTs",
				component: NewNFTsVue,
				meta: { title: "New NFTs" },
			},
			{
				path: "/nfts/hot",
				name: "Hot NFTs",
				component: HotNFTsVue,
				meta: { title: "Hot NFTs" },
			},
			{
				path: "/nfts/minting",
				name: "Minting",
				component: MintingVue,
				meta: { title: "Minting" },
			},
		],
	},
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});
