<script setup lang="ts">
import { computed } from "vue";
import { useCurrency } from "../../hooks/useCurrency";
import { type TokenBalance, useUser } from "../../hooks/useUser";
import { usePrices } from "../../hooks/usePrices";

import ProxyImage from "../../components/ProxyImage.vue";
import Twitter from "../../components/icons/Twitter.vue";
import Github from "../../components/icons/Github.vue";
import Discord from "../../components/icons/Discord.vue";
import Telegram from "../../components/icons/Telegram.vue";
import Icon from "../../components/Icon.vue";
import { ChevronDownIcon, GlobeAltIcon } from "@heroicons/vue/24/outline";
import { useDiscordAccount } from "../../hooks/useDiscordAccount";

defineProps<{ value: number }>();

const { user } = useUser();
const { format } = useCurrency();
const { prices } = usePrices();
const { isActiveSubscription } = useDiscordAccount();
interface PricedToken extends Omit<TokenBalance, "balance"> {
  balance: number;
  price: number;
}

const pricedTokens = computed(() => {
  return user.tokens
    .reduce((acc, balance) => {
      if (!balance.token?.listed) {
        return acc;
      }

      return acc.concat({
        ...balance,
        balance: Number(balance.balance) / 10 ** balance.token.decimals,
        price: prices[balance.token.address],
      });
    }, [] as PricedToken[])
    .sort((a: PricedToken, b: PricedToken) => {
      const aWorth = a.balance * a.price;
      const bWorth = b.balance * b.price;
      if (!aWorth && bWorth) return 1;
      if (aWorth && !bWorth) return -1;
      if (aWorth && bWorth) return bWorth - aWorth;
      return a.token.symbol.localeCompare(b.token.symbol);
    });
});

const tokens = computed(() => {
    if (isActiveSubscription.value) {
        return pricedTokens.value
    }

    return pricedTokens.value.slice(0, 5)
})
</script>
<template>
    <details open class="[&_svg.icon]:open:-rotate-180">
        <summary class="px-4 list-none flex items-center">
            <ChevronDownIcon class="w-4 mb-1 mr-2 icon" />
            Tokens <span class="px-2 text-calypso-500">{{ format(value) }}</span>
        </summary>

        <!-- TODO: only show i.e. top 10 tokens here? -->
        <ul class="grid gap-2 p-4 w-full">
            <li v-for="balance in tokens"
                class="shadow dark:bg-calypso-900 bg-zinc-200 grid grid-cols-3 md:grid-cols-4 md:grid-flow-col auto-cols-min items-center justify-between gap-2 rounded-lg rounded-tl-2xl md:rounded-l-full pr-2">
                <div class="flex gap-2 items-center justify-start">
                    <ProxyImage v-if="balance.token.logo" :src="balance.token.logo" :width="50" :height="50"
                        class="w-8 h-8 rounded-full dark:bg-zinc-900 bg-zinc-400" />
                    <Icon v-else name="currency" class="text-calypso-400 w-8 h-8 bg-zinc-800 rounded-full" />
                    <div>
                        <div class="text-sm -mb-1">{{ balance.token.symbol }}</div>
                        <div class="text-xs opacity-50">
                            {{ balance.balance.toLocaleString() }}
                        </div>
                    </div>
                </div>

                <div v-if="balance.price" class="text-clip overflow-auto opacity-50">
                    {{ format(balance.price) }}
                </div>

                <div v-if="balance.price"
                    class="text-clip overflow-auto font-bold text-calypso-700 dark:text-calypso-500">
                    {{ format(balance.price * balance.balance) }}
                </div>

                <div class="flex gap-2 justify-end w-full col-span-3 pb-2 md:pb-0" v-if="true">
                    <component :is="balance.token.social?.twitter ? 'a' : 'span'" :href="balance.token.social?.twitter"
                        target="_blank" :class="
              balance.token.social?.twitter
                ? ''
                : 'opacity-25 cursor-not-allowed'
            " class="h-4 w-4 md:h-6 md:w-6 text-calypso-500 dark:text-calypso-50">
                        <Twitter class="h-4 w-4 md:h-6 md:w-6 text-calypso-500" />
                    </component>
                    <component :is="balance.token.social?.github ? 'a' : 'span'" :href="balance.token.social?.github"
                        target="_blank" :class="
              balance.token.social?.github
                ? ''
                : 'opacity-25 cursor-not-allowed'
            " class="h-4 w-4 md:h-6 md:w-6 text-calypso-500 dark:text-calypso-50">
                        <Github class="h-4 w-4 md:h-6 md:w-6 text-calypso-500" />
                    </component>

                    <component :is="balance.token.social?.website ? 'a' : 'span'" :href="balance.token.social?.website"
                        target="_blank" :class="
              balance.token.social?.website
                ? ''
                : 'opacity-25 cursor-not-allowed'
            " class="h-4 w-4 md:h-6 md:w-6 text-calypso-500 dark:text-calypso-50">
                        <GlobeAltIcon class="h-4 w-4 md:h-6 md:w-6 text-calypso-500" />
                    </component>

                    <component :is="balance.token.social?.discord ? 'a' : 'span'" :href="balance.token.social?.discord"
                        target="_blank" :class="
              balance.token.social?.discord
                ? ''
                : 'opacity-25 cursor-not-allowed'
            " class="h-4 w-4 md:h-6 md:w-6 text-calypso-500 dark:text-calypso-50">
                        <Discord class="h-4 w-4 md:h-6 md:w-6 text-calypso-500" />
                    </component>

                    <component :is="balance.token.social?.telegram ? 'a' : 'span'"
                        :href="balance.token.social?.telegram" target="_blank" :class="
              balance.token.social?.telegram
                ? ''
                : 'opacity-25 cursor-not-allowed'
            " class="h-4 w-4 md:h-6 md:w-6 text-calypso-500 dark:text-calypso-50">
                        <Telegram class="h-4 w-4 md:h-6 md:w-6 text-calypso-500" />
                    </component>
                </div>

                <!-- <div class="flex gap-2">
                    <EyeSlashIcon class="h-6 w-6 text-red-500 opacity-50 cursor-not-allowed" />
                </div> -->
            </li>
            <li v-if="!isActiveSubscription && pricedTokens.length > 5"
                class="shadow dark:bg-calypso-900 bg-zinc-200 items-center justify-between gap-2 rounded-l-full pr-2">
                <div class="flex items-center">

                    <div class="h-8 pl-2 text-sm flex items-center pl-10 w-full">
                        View {{ pricedTokens.length - tokens.length }} More with an active Pro subscription
                    </div>
                </div>
            </li>
        </ul>
    </details>
</template>
