import { useUser } from "../hooks/useUser";

export async function loadWalletData() {
	const { user, setBalances } = useUser();
	// pass array to make multiple wallest easier later
	const query = new URLSearchParams({ address: [user.wallet].join(",") });
	const data = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/balances?${query}`,
	).then((a) => a.json());

	setBalances(data.balances);
}
