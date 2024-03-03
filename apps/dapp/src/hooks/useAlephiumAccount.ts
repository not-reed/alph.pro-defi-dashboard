import { Account as Web3Account, NetworkId } from "@alephium/web3";
import { reactive } from "vue";

export type Account = Web3Account & { networkId: NetworkId | undefined };

const account = reactive<Account>({
	networkId: undefined,
	keyType: "default",
	group: 0,
	address: "",
	publicKey: "",
});
function setAccount(value: Account) {
	account.networkId = value.networkId;
	account.address = value.address;
	account.publicKey = value.publicKey;
	account.keyType = value.keyType;
	account.group = value.group;
}
function clearAccount() {
	account.address = "";
	account.publicKey = "";
}
export function useAlephiumAccount() {
	return { account, setAccount, clearAccount };
}
