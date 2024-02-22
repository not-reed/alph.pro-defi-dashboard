
import { ref } from "vue"


const amounts = ref<number[]>(new Array(20).fill(0))
function setAmounts(amounts_: number[]) {
    amounts.value = amounts_
}
export function useTotalSupply() {
    return { amounts, setAmounts }
}
