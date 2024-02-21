<script setup lang="ts">
import { labels, images } from '../data';
import { useMint } from '../hooks/useMint'
import { useTotalSupply } from '../hooks/useTotalSupply';
import { useToast } from "../toasts";

defineProps<{ labelIndex: number[] }>();

const toast = useToast()
console.log({ toast })
const { mint } = useMint()
const { amounts } = useTotalSupply()

function mintFood(idx: number) {
    if (amounts.value[idx] < 50) {
        mint(idx)
    } else {
        toast.error(`${labels[idx]} is sold out!`);

    }
}

</script>

<template>
    <div>
        <div class="inside_glass">
            <div class="drinks" style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));">
                <div class="drink bounce" @click="mintFood(idx)" v-for="idx in labelIndex"
                    style="display: flex; height: 100%;">
                    <img :src="`/images/${images[idx]}.svg`" style="margin: 0 auto; width: 70%;" v-if="amounts[idx] < 50" />
                    <div v-else class="pacifico-regular"
                        style="text-align: center; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: black;">
                        Sold Out
                    </div>
                </div>
            </div>
        </div>

        <div
            style="display: grid; color: black; grid-template-columns: repeat(5, minmax(0, 1fr)); text-align: center; justify-content: center; align-items: center;">
            <div class="label" v-for="idx in labelIndex" style="width: 100%;">{{ labels[idx] }} {{ Math.max(50 -
                amounts[idx], 0) }}/50
            </div>
        </div>
        <div class="glass-overlay"></div>
    </div>
</template>

<style  lang="scss">
$t: transparent;
$teal: #54D9D1;
$dteal: #43ada7;
$do: #d96d8b;

$pink: #F27A9B;
$orange: #EB7131;
$bk: #fff;
$ddteal: #29b88c;

@mixin for-phone-only {
    @media (max-width: 599px) {
        @content;
    }
}


.inside_glass {
    border-radius: 14px;

    position: relative;
    left: 50%;
    top: 5%;
    transform: translate(-50%, 0);
    background:
        // top bar
        linear-gradient(rgba(#dcdcdc, .5)40%,
            // rgba(#dcdcdc,.0),
            rgba($teal, .5)55%,
            rgba($t, .3),
        ) 51% 0% / 57.1em 20em,
        // btm bar
        linear-gradient(to right,
            rgba(#dcdcdc, .7) 50%,
            rgba(#dcdcdc, .7) 51%,
        ) 50.8% 100% / 47.2em 1.7em,
        // left corner
        linear-gradient(to right,
            rgba(#dcdcdc, .7) 20%, rgba($do, 0) 65%,
        ) 97.5% 0% / .6em 20em,
        linear-gradient(45deg,
            rgba(#dcdcdc, .8) 42%,
            rgba(#dcdcdc, .7) 43%,
            rgba(#dcdcdc, .7) 44.5%,
            rgba($t, .0) 45%,
        ) 54.4em 106% / 15em 2.8em,
        // left corner
        linear-gradient(to right,
            rgba(#dcdcdc, .7) 20%, rgba($do, 0) 65%,
        ) 3.6% 0% / .6em 20em,
        linear-gradient(-45deg,
            rgba(#dcdcdc, .8) 42%,
            rgba(#dcdcdc, .7) 43%,
            rgba(#dcdcdc, .7) 44.5%,
            rgba($do, 0) 45%,
        ) -7.75em 106% / 15em 2.8em,
        rgba(#fff, .3);
    ;
    background-repeat: no-repeat;

    .drinks {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .drink {
            &:hover {
                cursor: pointer;
                transform: scale(1.1);
            }

            transition: 0.3s;
        }
    }
}

.glass {
    width: 61.5em;
    height: 21.5em;
    border-radius: 15px;
    position: absolute;
    left: 50%;
    top: 5%;
    transform: translate(-50%, 0);
    border-top: 2px solid rgba(#2e7672, 1);
    border-left: 2px solid rgba(#2e7672, 1);
    border-right: 2px solid rgba(#2e7672, 1);
    background:
        rgba(#fff, .2);
    background-repeat: no-repeat;

    &:after {
        border-radius: 15px;
        width: 61.5em;
        height: 21.5em;
        content: '';
        position: absolute;
        left: -.6%;
        top: -2.5%;
        border-top: 2px solid $teal;
        border-left: 2px solid $teal;
        border-right: 2px solid $teal;
    }
}

.btn_container {
    z-index: 6;
    width: 100%;
    height: 10em;
    background: $dteal;
    position: absolute;
    top: 40.5%;

    @include for-phone-only {
        top: 32%;
    }
}

.buttons {
    background: $dteal;
    position: absolute;
    width: 50em;
    height: 8.5em;
    top: 48%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 7px;
    text-align: center;

    .btn_row {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .btn {
        border-radius: 5px;
        width: 7.5em;
        height: 4em;
        border: 2px solid #4BC3BC;
        position: relative;
        background:
            linear-gradient(to bottom,
                rgba($pink, .4),
                rgba(#fff, .1)),
            $teal;

        &:after {
            width: 7.5em;
            height: 3.8em;
            border-top: 1px solid #215653;
            border-right: 2px solid #215653;
            content: '';

            position: absolute;
            border-radius: 5px;
            top: 0%;
            left: 50%;
            transform: translate(-50%, 0%);
        }

        h1 {
            text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 2px #87E4DE, 0 0 2px #87E4DE, 0 0 2px #87E4DE, 0 0 3px #87E4DE, 0 0 5px #87E4DE;
            font-size: 1.5em;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #232323;
        }
    }

    .red.select {
        width: 2.5em;
        height: 2.5em;

        &:after {
            content: '';
            width: 2em;
            height: 2em;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #8B0C00;
            box-shadow: 1px 1px 1px 1px rgba(#232323, .6);
        }
    }

    .select {
        margin-top: 15px;
        width: 2.5em;
        height: 2.5em;
        background: #C0C0C0;
        border-radius: 50%;
        margin: auto;
        align-self: flex-end;
        border: 2px solid #C0C0C0;
        position: relative;

        &:after {
            content: '';
            width: 2em;
            height: 2em;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e6e6e6;
            box-shadow: 1px 1px 1px 1px rgba(#232323, .6);
        }
    }
}


.label {
    font-weight: bold;
    padding-top: 0.5rem;
    text-align: center;
    font-size: 1rem;

    @include for-phone-only {
        font-size: 0.75rem;
    }
}
</style>
