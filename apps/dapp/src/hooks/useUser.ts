import { reactive } from "vue";

const user = reactive({
	// TODO: empty wallet by default, this was random picked from richlist
	// and just here for testing
	wallet: "",
	history: [] as string[],
	balances: [] as any[],
});

function setBalances(balances: any[]) {
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
