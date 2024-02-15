// type Link =
// 	| {
// 			name: string;
// 			path: string;
// 	  }
// 	| {
// 			name: string;
// 			children: Link[];
// 	  };

import { computed } from "vue";
import { routes } from "../router";
import { RouteRecordRaw } from "vue-router";

// // const links = [
// // 	{
// 		name: "Home",
// 		path: "/",
// 	},
// 	{
// 		name: "Portfolio",
// 		children: [
// 			{
// 				name: "Overview",
// 				path: "/",
// 			},
// 			{
// 				name: "Wallet",
// 				path: "/",
// 			},
// 			{
// 				name: "DeFi",
// 				path: "/",
// 			},
// 		],
// 	},
// 	{
// 		name: "DeFi",
// 		children: [
// 			{
// 				name: "Liquidity Pools",
// 				path: "/",
// 			},
// 			{
// 				name: "Swaps",
// 				path: "/",
// 			},
// 			{
// 				name: "Opportunities",
// 				path: "/",
// 			},
// 		],
// 	},
// 	{
// 		name: "Tokens",
// 		children: [
// 			{
// 				name: "New Tokens",
// 				path: "/",
// 			},
// 			{
// 				name: "Hot Tokens",
// 				path: "/",
// 			},
// 			{
// 				name: "Fresh Liquidity",
// 				path: "/",
// 			},
// 		],
// 	},
// 	{
// 		name: "NFTs",
// 		children: [
// 			{
// 				name: "New NFTs",
// 				path: "/",
// 			},
// 			{
// 				name: "Hot NFTs",
// 				path: "/",
// 			},
// 			{
// 				name: "Minting",
// 				path: "/",
// 			},
// 		],
// 	},
// ] satisfies Link[];

interface RouteWithoutComponent
	extends Omit<RouteRecordRaw, "component" | "children"> {
	children?: RouteWithoutComponent[];
}

function withoutComponent(route: RouteRecordRaw): RouteWithoutComponent {
	const { component, ...rest } = route;
	return {
		...rest,
		children: route.children?.map(withoutComponent),
	};
}

const links = routes.map(withoutComponent);

export function useNavLinks() {
	return { links };
}
