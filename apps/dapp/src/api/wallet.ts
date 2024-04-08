import { useUser } from "../hooks/useUser";

// export async function loadWalletData() {
// 	//TODO: if user is logged in with discord, load all saved wallets + connected/requested wallet
// 	// if the user is not logged in with discord, only load connected/requested wallet
// 	const { user, setBalances } = useUser();
// 	// pass array to make multiple wallest easier later
// 	const query = new URLSearchParams({ address: [user.wallet].join(",") });
// 	const url = `${import.meta.env.VITE_API_ENDPOINT}/api/balances?${query}`;
// 	const data = await fetch(url).then((a) => a.json());

// 	setBalances(data.balances);
// }
