import { ref } from "vue"
import { images } from "../data"


import { loadDeployments } from "@repo/vending-machine/artifacts/ts/deployments"
import { MintNft } from "@repo/vending-machine/artifacts/ts"
import { useProvider } from "./useProvider"
import { DUST_AMOUNT, ONE_ALPH } from "@alephium/web3"
import NProgress from "nprogress"
import { useToast } from "vue-toastification";

const state = ref<'idle' | 'minting' | 'minted'>('idle') 
const selection = ref<number>(0)
const amount = ref<number>(1)

const pending = ref(new Set<string>())

async function mint(item: number) {
    const toast = useToast();

    try {
        NProgress.start()
    
        const { getProvider } = useProvider()
        const provider = getProvider()
        if (!provider?.signer) {
            console.warn("Could not find available signer")
            return;
        }

        const vendingMachineAddress = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts.VendingMachine?.contractInstance.contractId
        if (!vendingMachineAddress) {
            console.error("Failed to find deployment")
            return;
        }
        
        console.log(`Minting ${images[item]} with amount ${amount.value}`)
        state.value = 'idle'
        const tx = await MintNft.execute(provider.signer, {
            initialFields: {
                vendingMachine: vendingMachineAddress,
                foodTypeId: BigInt(item),
                mintAmount: BigInt(amount.value)
            },
            attoAlphAmount: BigInt(amount.value) * (ONE_ALPH + ONE_ALPH + DUST_AMOUNT),
        })

        toast("Mint Successful");
        selection.value = item
        state.value = 'minted'
        NProgress.done()
    } catch (err) {
        NProgress.done()
        console.error(err)

    }
}
export function useMint() {
    return { state, mint, selection, amount }
}
