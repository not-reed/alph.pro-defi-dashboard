import { reactive } from "vue";
import { usePrices } from "./usePrices";
interface TokenBalance {
  token: {
    address: string;
    listed: boolean;
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
  //
  wallet: "",
  walletLoaded: false,
  balances: [] as TokenBalance[],
});

const user = reactive(EMPTY_USER());

function setBalances(balances: TokenBalance[]) {
  user.walletLoaded = true;
  user.balances = balances;
}

async function loadBalances(wallet: string) {
  if (!wallet) {
    setBalances([]);
    return;
  }

  const { updatePrices } = usePrices();
  //TODO: if user is logged in with discord, load all saved wallets + connected/requested wallet
  // if the user is not logged in with discord, only load connected/requested wallet

  // pass array to make multiple wallets easier later
  const query = new URLSearchParams({ address: [wallet].join(",") });
  const url = `${import.meta.env.VITE_API_ENDPOINT}/api/balances?${query}`;
  const data = await fetch(url).then((a) => a.json());

  const tokens = data.balances.reduce(
    (acc: string[], balance: TokenBalance) =>
      balance.token ? acc.concat(balance.token.address) : acc,
    []
  );
  await updatePrices(tokens);
  setBalances(data.balances);
}

function setWallet(wallet: string) {
  user.walletLoaded = false;
  user.wallet = wallet;
}

function resetUser() {
  Object.assign(user, EMPTY_USER());
}

export function useUser() {
  return { user, setWallet, setBalances, resetUser, loadBalances };
}
