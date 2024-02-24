import { reactive } from "vue";
interface TokenBalance {
	token: {
		address: string;
		verified: boolean;
		symbol: string;
		name: string;
		decimals: number;
		logo: string;
		description: string;
		id: string;
		totalSupply: string;
	};
	balance: number;
}

const EMPTY_USER = () => ({
	// TODO: empty wallet by default, this was random picked from richlist
	// and just here for testing
	wallet: "",
	history: [] as string[],
	balances: [] as TokenBalance[],
});

const user = reactive(EMPTY_USER());

function setBalances(balances: TokenBalance[]) {
	user.balances = balances;
}

function setWallet(wallet: string) {
	if (user.wallet) {
		user.history.push(user.wallet);
	}
	user.wallet = wallet;
}

function resetUser() {
	Object.assign(user, EMPTY_USER());
}

export function useUser() {
	return { user, setWallet, setBalances, resetUser };
}
