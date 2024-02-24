import { useUser } from "../hooks/useUser";

export async function loadWalletData() {
	const { user, setBalances } = useUser();
	// pass array to make multiple wallest easier later
	const query = new URLSearchParams({ address: [user.wallet].join(",") });
	const url = `${import.meta.env.VITE_API_ENDPOINT}/api/balances?${query}`;
	const data = await fetch(url).then((a) => a.json());

	setBalances(data.balances);
}
