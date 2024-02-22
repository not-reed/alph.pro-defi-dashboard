<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useMint } from '../hooks/useMint'
import { ConnectorId, useConnect } from '../hooks/useConnect';
import { useAccount } from '../hooks/useAccount';
import { images } from '../data';

const { state, selection, amount } = useMint()
const { connect, disconnect, autoConnect } = useConnect()
const { account } = useAccount()

function validate() {
    if (amount.value < 1) {
        amount.value = 1
    }
    if (amount.value > 10) {
        amount.value = 10
    }
    if (Number.isNaN(amount.value)) {
        amount.value = 1
    }
}
const showModal = ref(false)

function openModal() {
    showModal.value = true;
}

onMounted(() => {
    autoConnect()
})

async function connectWith(str: ConnectorId) {
    await connect(str)
    showModal.value = false;
}

async function disconnectWith() {
    await disconnect()
    showModal.value = false;
}
</script>

<template>
    <div v-if="showModal" @click.self="showModal = false"
        style="background: #00000099; z-index: 5;display: flex; flex-flow: row wrap; align-items: center; justify-content: center; top: 0; bottom: 0; right: 0; left: 0;  position: fixed;">
        <div
            style="background: #356e90; display: flex;border-radius: 5px; flex-flow: column; gap: 1rem; z-index: 10; padding: 1rem; font-size: 1.5rem;">

            <div @click="connectWith('injected')" v-if="!account.address"
                style=" padding: 0.75rem; text-align: center;border-radius: 5px; background:rgb(49, 72, 85); border-style: solid;">
                Extension
                Wallet</div>
            <div @click="connectWith('walletConnect')" v-if="!account.address"
                style=" padding: 0.75rem; text-align: center;border-radius: 5px; background: rgb(49, 72, 85); border-style: solid;">
                Wallet
                Connect
            </div>
            <div @click="connectWith('desktopWallet')" v-if="!account.address"
                style=" padding: 0.75rem; text-align: center;border-radius: 5px; background: rgb(49, 72, 85); border-style: solid;">
                Desktop/Mobile
                Wallet
            </div>

            <div @click="disconnectWith()" v-if="account.address"
                style=" padding: 0.75rem; text-align: center;border-radius: 5px; background: rgb(49, 72, 85); border-style: solid;">
                Disconnect
            </div>
        </div>

    </div>
    <div class="bottom"
        style="display: flex; padding: 1rem; justify-content: space-between; align-items: flex-end; max-height: 250px;">
        <div style="position:relative; display: flex; align-items: flex-start; justify-content: center;">
            <div class="slot">

            </div>
            <div class="img" :class="state === 'idle' ? 'up' : 'down'">
                <img :src="`/images/${images[selection]}.svg`" style="margin: 0 auto; width: 70%;" />
            </div>
        </div>
        <div>

        </div>
        <div class="insert-wrapper">
            <div class="insert insert-input" style="max-width: 135px;">
                <input min=" 1" max="10" step="1" v-model="amount" @blur="validate" type="number" />
            </div>

            <div class="insert connect" :class="account.address ? 'connected' : 'disconnected'" @click="openModal"
                style="max-width: 135px;">
                <h1>{{ account.address ? account.address.slice(0, 6) : 'CONNECT' }}</h1>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
$teal: #54D9D1;
$dteal: #43ada7;

@mixin for-phone-only {
    @media (max-width: 599px) {
        @content;
    }
}

.bottom {
    @include for-phone-only {
        margin-top: 0;
    }

    background: $dteal;
    width: 100%;
}

.slot-num input {
    z-index: 3;
    font-size: 1.5rem;
    text-align: center;

    height: 6em;
    border: 2px solid $dteal;
    border-bottom: 2px solid #87e4de;
    position: relative;
    border-radius: 7px;
    border-top: 2px solid #2e7672;
    border-left: 1px solid #2e7672;
    border-right: 2px solid #2e7672;
    box-shadow: inset 10px 10px 15px 8px rgba(#232323, .5);
    background-repeat: no-repeat;

    &:after {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        background: $dteal;
        top: -100%;
        left: 0;
    }
}

.slot {
    z-index: 3;

    width: 27em;
    max-width: 180px;
    max-height: 90px;
    height: 13em;
    border: 2px solid $dteal;
    border-bottom: 2px solid #87e4de;
    position: relative;
    border-radius: 7px;
    border-top: 2px solid #2e7672;
    border-left: 1px solid #2e7672;
    border-right: 2px solid #2e7672;
    box-shadow: inset 10px 10px 15px 8px rgba(#232323, .5);
    background-repeat: no-repeat;

    &:after {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        background: $dteal;
        top: -100%;
        left: 0;
    }
}

.img {
    position: absolute;
    z-index: 2;
    transition: 1s;
    height: 100%;

    img {
        height: 100%;
    }

    &.up {
        top: -100%;
    }

    &.down {
        top: 0%;
    }
}

.insert {
    @include for-phone-only {
        width: 40%;
        height: 10em;
    }

    font-family: arial;
    width: 13em;
    height: 6em;
    border: 2px solid $dteal;
    border-bottom: 2px solid #4bc3bc;

    position: relative;
    border-radius: 7px;
    background: $teal;

    &.connect:before {
        content: '';
        width: .8em;
        height: .8em;
        position: absolute;
        top: 30%;
        left: 86%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 20px yellowgreen, 0 0 20px yellowgreen, 0 0 30px yellowgreen, 0 0 60px yellowgreen, 0 0 70px yellowgreen;
        background:
            linear-gradient(to top,
                rgba(limegreen, 1), rgba(limegreen, 1),
            ) 50% 0% / 100% 100%,
        ;
        background-repeat: no-repeat;
    }

    &.connect:after {
        content: '';
        width: 10em;
        height: 1.2em;
        border: 2px solid $dteal;
        position: absolute;
        top: 65%;
        left: 50%;
        transform: translate(-50%, -50%);
        background:
            linear-gradient(to top,
                rgba(#4bc3bc, 1), rgba(#19413e, 1),
            ) 50% 0% / 100% 100%,
        ;
        background-repeat: no-repeat;
    }

    &.disconnected {
        background: #7a3838;

        &.connect:before {
            box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 20px yellowgreen, 0 0 20px yellowgreen, 0 0 30px yellowgreen, 0 0 60px yellowgreen, 0 0 70px yellowgreen;
            background:
                linear-gradient(to top,
                    rgba(rgb(233, 7, 7), 1), rgba(rgb(233, 7, 7), 1),
                ) 50% 0% / 100% 100%,
            ;
            background-repeat: no-repeat;
        }

        &.connect:after {
            background:
                linear-gradient(to top,
                    rgba(#c34b4b, 1), rgba(#411919, 1),
                ) 50% 0% / 100% 100%,
            ;
        }
    }

    h1,
    input {
        font-weight: bolder;
        font-size: 1.5em;
        letter-spacing: 2px;
        text-align: center;
        margin-top: .6em;
    }

    input {
        font-size: 2rem;
        margin-top: 0;
        background: none;
        position: relative;
        border: none;
        width: 100%;
        height: 100%;
    }
}

.insert-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}
</style>
