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
const user = reactive({
	// TODO: empty wallet by default, this was random picked from richlist
	// and just here for testing
	wallet: "18Mp5eHjtLCzjc4gggSPBYETdD37czoFDtndGj2u2j4wv",
	history: [] as string[],
	balances: [] as TokenBalance[],
});

function setBalances(balances: TokenBalance[]) {
	user.balances = balances;
}

function setWallet(wallet: string) {
	if (user.wallet) {
		user.history.push(user.wallet);
	}
	user.wallet = wallet;
}

export function useUser() {
	return { user, setWallet, setBalances };
}
