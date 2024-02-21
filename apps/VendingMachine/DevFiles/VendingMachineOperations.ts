require('dotenv').config({ path: '../.env' })

import { web3, DUST_AMOUNT, stringToHex, ONE_ALPH } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { VendingMachine, ToggleMintState, UpdateCollectionUri, UpdateBaseUri, WithdrawAlph } from '../artifacts/ts'

let vendingMachineContractAddress = 'zniszMzfLguVeqE3vh3cenFQFJV4JAVY6Jq6Jfzm4GPH' //TestNet
web3.setCurrentNodeProvider('https://wallet-v20.testnet.alephium.org', undefined, fetch) //MainNet
const signer = new PrivateKeyWallet({ privateKey: process.env.TEST_NET_PRIVATE_KEYS as string })

//let vendingMachineContractAddress = '25KtADDFxVcMC4bnVjN6dShB8Q4DgiGczJ9uiEHZpBwQs' //MainNet
// web3.setCurrentNodeProvider('https://wallet-v20.mainnet.alephium.org', undefined, fetch) //MainNet
// const signer = new PrivateKeyWallet({ privateKey: process.env.TEST_NET_PRIVATE_KEYS as string })

const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
const NO_DECIMALS = 10 ** 18

export async function updateCollectionUri(collectionUri: string) {
  console.log('Collection URI before update: ', (await vendingMachineStates.methods.getCollectionUri()).returns)

  await UpdateCollectionUri.execute(signer, {
    initialFields: {
      vendingMachine: vendingMachineContractAddress as string,
      newCollectionUri: stringToHex(collectionUri)
    },
    attoAlphAmount: DUST_AMOUNT
  })

  console.log('Collection URI after update: ', (await vendingMachineStates.methods.getCollectionUri()).returns)
}

export async function updateBaseUri(collectionUri: string) {
  console.log('Base URI before update: ', (await vendingMachineStates.methods.getBaseUri()).returns)

  await UpdateBaseUri.execute(signer, {
    initialFields: {
      vendingMachine: vendingMachineContractAddress as string,
      newBaseUri: stringToHex(collectionUri)
    },
    attoAlphAmount: DUST_AMOUNT
  })

  console.log('Base URI after update: ', (await vendingMachineStates.methods.getBaseUri()).returns)
}

export async function toggleMintState() {
  console.log('Is Mint Paused before: ', (await vendingMachineStates.methods.isMintPaused()).returns)

  await ToggleMintState.execute(signer, {
    initialFields: {
      vendingMachine: vendingMachineContractAddress as string
    },
    attoAlphAmount: DUST_AMOUNT
  })

  console.log('Is Mint Paused after: ', (await vendingMachineStates.methods.isMintPaused()).returns)
}

export async function checkContractBalance() {
  let contractAlphBalance = await getAlphBalance(vendingMachineStates.address, signer)
  console.log('Vending Machine Contract balance', Number(contractAlphBalance) / NO_DECIMALS)
}

//No need to call withRoyalty after calling this function
export async function withdrawAlph() {
  console.log('User ALPH before withdraw', Number(await getAlphBalance(signer.address, signer)) / NO_DECIMALS)
  let contractAlphBalance = await getAlphBalance(vendingMachineStates.address, signer)
  console.log('Contract balance before withdraw', Number(contractAlphBalance) / NO_DECIMALS)

  await WithdrawAlph.execute(signer, {
    initialFields: {
      vendingMachine: vendingMachineContractAddress as string,
      to: signer.address,
      amount: (BigInt(contractAlphBalance) - 1n) * ONE_ALPH
    },
    attoAlphAmount: DUST_AMOUNT
  })

  console.log('User ALPH before withdraw', Number(await getAlphBalance(signer.address, signer)) / NO_DECIMALS)
  contractAlphBalance = await getAlphBalance(vendingMachineStates.address, signer)
  console.log('Contract balance before withdraw', Number(contractAlphBalance) / NO_DECIMALS)
}

async function getAlphBalance(address: string, signer: PrivateKeyWallet): Promise<string> {
  return (await signer.nodeProvider.addresses.getAddressesAddressBalance(address)).balance
}
