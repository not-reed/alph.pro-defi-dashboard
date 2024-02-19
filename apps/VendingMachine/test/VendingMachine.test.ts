import { expect, describe, it, beforeAll } from 'bun:test'
import { web3, DUST_AMOUNT, ONE_ALPH, hexToString, stringToHex, sign } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testNodeWallet, getSigners, testAddress } from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import {
  Foods,
  ToggleMintState,
  UpdateBaseUri,
  VendingMachine,
  WithdrawAlph,
  MintNft,
  WithdrawRoyalty
} from '../artifacts/ts'

import axios from 'axios'

describe('Vending Machine', async () => {
  let signer
  let foodsContractAddress
  let vendingMachineContractAddress
  const NO_DECIMALS = 1000000000000000000

  const [signer1] = await getSigners(1, ONE_ALPH * 1000n, 0) //Group 0

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    signer = await testNodeWallet()
    const deployments = await deployToDevnet()
    const foodsDeployed = deployments.getDeployedContractResult(0, 'Foods')
    if (foodsDeployed === undefined) {
      console.log(`The contract is not deployed on group 0`)
    }

    const vendingMachineDeployed = deployments.getDeployedContractResult(0, 'VendingMachine')
    if (vendingMachineDeployed === undefined) {
      console.log(`The contract is not deployed on group 0`)
    }

    foodsContractAddress = foodsDeployed?.contractInstance.address
    vendingMachineContractAddress = vendingMachineDeployed?.contractInstance.address
    console.log('...........................................................................')
    const account = await signer.getAccounts()
    const testAddress = account[0].address

    const testGroup = account[0].group
  })

  it('should display Foods Info', async () => {
    const foodsStates = Foods.at(foodsContractAddress)
    const fetchStates = await foodsStates.fetchState()

    console.log('Token URI: ', hexToString(fetchStates.fields.tokenUri))
    console.log('Collection ID: ', hexToString(fetchStates.fields.collectionId))
    console.log('nft Index: ', fetchStates.fields.nftIndex)
    console.log('Foods Contract address: ', foodsStates.address)
    console.log('Foods contract ID: ', foodsStates.contractId)
  })

  it('should display Vending Machine Info', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
    console.log('Collection Contract both ', vendingMachineStates.address, vendingMachineContractAddress)
    console.log('Collection URI: ', hexToString((await vendingMachineStates.methods.getCollectionUri()).returns))
    console.log('Collection Owner: ', (await vendingMachineStates.methods.getOwner()).returns)
    console.log('Max Supply: ', (await vendingMachineStates.methods.getMaxSupply()).returns)
    console.log('Total Supply: ', (await vendingMachineStates.methods.totalSupply()).returns)
    console.log('Mint Price: ', (await vendingMachineStates.methods.getMintPrice()).returns)
    console.log('Is Mint Paused: ', (await vendingMachineStates.methods.isMintPaused()).returns)
    console.log('Foods Contract: ', (await vendingMachineStates.methods.getFoodsContract()).returns)
    console.log('Base URI: ', hexToString((await vendingMachineStates.methods.getBaseUri()).returns))
    console.log(
      'Vending Machine ALPH balance',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )
  })

  it('should not let non-owner withdraw alph ', async () => {
    expect(
      WithdrawAlph.execute(signer1, {
        initialFields: {
          vendingMachine: vendingMachineContractAddress,
          to: testAddress,
          amount: 10n
        },
        attoAlphAmount: DUST_AMOUNT
      })
    ).rejects.toThrow('AssertionFailedWithErrorCode')
  })

  it('should not display non minted NFT info', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
    expect(vendingMachineStates.methods.getNFTUri({ args: { index: 7777n } })).rejects.toThrow(
      'AssertionFailedWithErrorCode'
    )
  })

  it('should update Base URI ', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)

    await UpdateBaseUri.execute(signer, {
      initialFields: {
        vendingMachine: vendingMachineContractAddress,
        newBaseUri: stringToHex('https://newBase/')
      },
      attoAlphAmount: DUST_AMOUNT
    })

    console.log('New Base URI: ', hexToString((await vendingMachineStates.methods.getBaseUri()).returns))
  })

  it('should Toggle Mint state ', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)

    await ToggleMintState.execute(signer, {
      initialFields: {
        vendingMachine: vendingMachineContractAddress
      },
      attoAlphAmount: DUST_AMOUNT
    })

    console.log('Is Mint Paused: ', (await vendingMachineStates.methods.isMintPaused()).returns)
  })

  it('should Mint an NFT', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
    let mintPrice = (await vendingMachineStates.methods.getMintPrice()).returns
    console.log(`Mint Price: ${mintPrice / BigInt(NO_DECIMALS)} ALPH`)
    let mintAmount = 10n
    console.log('Total Mint: ', mintAmount)
    let alphNeededForMint = mintPrice * mintAmount
    let alphNeededForSubcontract = mintAmount * ONE_ALPH + mintAmount * DUST_AMOUNT
    let totalAlphNeeded = alphNeededForMint + alphNeededForSubcontract
    console.log('Signer 1 owner: ', signer1.address)
    console.log('Signer 1 ALPH balance: ', Number(await getAlphBalance(signer1.address, signer)) / NO_DECIMALS)
    console.log(
      'Foods Collection ALPH balance before Mint',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )
    let newNftCreated = await MintNft.execute(signer1, {
      initialFields: {
        vendingMachine: vendingMachineContractAddress,
        foodTypeId: 2n,
        mintAmount: mintAmount
      },
      attoAlphAmount: totalAlphNeeded
    })

    console.log('user sent alph amount ', totalAlphNeeded / 1000000000000000000n)

    console.log('Signer1 ALPH balance after mint', Number(await getAlphBalance(signer1.address, signer)) / NO_DECIMALS)
    console.log(
      'Vending machine Collection ALPH balance after Mint',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )

    let returnedTransaction = newNftCreated.txId

    let contractAddresses = await axios.get(
      `http://127.0.0.1:22973/transactions/details/${returnedTransaction}?fromGroup=0&toGroup=0`
    )
    contractAddresses = contractAddresses.data.generatedOutputs
    for (let i = 0; i < Number(mintAmount); i++) {
      let newNftContractAddress = contractAddresses[i].address
      const newNftContractState = Foods.at(newNftContractAddress)
      console.log('NFT Index: ', (await newNftContractState.methods.getNFTIndex()).returns)
    }
  })

  it('should  check user NFT balance ', async () => {
    console.log('Signer 1 Address ', signer1.address)
    console.log('Signer 1 ALPH balance: ', Number(await getAlphBalance(signer1.address, signer)) / NO_DECIMALS)
    console.log('User NFT balance', await getTokenBalance(signer1.address, foodsContractAddress, signer))
  })

  it('should  withdraw alph ', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
    console.log('test address ', testAddress)
    console.log('test ALPH balance before withdraw', Number(await getAlphBalance(testAddress, signer)) / NO_DECIMALS)
    console.log(
      'Vending machine Collection ALPH balance before withdraw',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )

    await WithdrawAlph.execute(signer, {
      initialFields: {
        vendingMachine: vendingMachineContractAddress,
        to: testAddress,
        amount: 10n
      },
      attoAlphAmount: DUST_AMOUNT * 2n
    })

    console.log('Test ALPH balance after withdraw', Number(await getAlphBalance(testAddress, signer)) / NO_DECIMALS)
    console.log(
      'Vending machine Collection ALPH balance after withdraw',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )
  })

  it('should display Vending Machine Info', async () => {
    const vendingMachineStates = VendingMachine.at(vendingMachineContractAddress)
    console.log('Collection Contract both ', vendingMachineStates.address, vendingMachineContractAddress)
    console.log('Collection URI: ', hexToString((await vendingMachineStates.methods.getCollectionUri()).returns))
    console.log('Collection Owner: ', (await vendingMachineStates.methods.getOwner()).returns)
    console.log('Max Supply: ', (await vendingMachineStates.methods.getMaxSupply()).returns)
    console.log('Total Supply: ', (await vendingMachineStates.methods.totalSupply()).returns)
    console.log('Mint Price: ', (await vendingMachineStates.methods.getMintPrice()).returns)
    console.log('Is Mint Paused: ', (await vendingMachineStates.methods.isMintPaused()).returns)
    console.log('Foods Contract: ', (await vendingMachineStates.methods.getFoodsContract()).returns)
    console.log('Base URI: ', hexToString((await vendingMachineStates.methods.getBaseUri()).returns))
    console.log(
      'Vending Machine ALPH balance',
      Number(await getAlphBalance(vendingMachineStates.address, signer)) / NO_DECIMALS
    )
  })
})

async function getAlphBalance(address: string, signer: PrivateKeyWallet): Promise<string> {
  return (await signer.nodeProvider.addresses.getAddressesAddressBalance(address)).balance
}

async function getTokenBalance(address: string, token: string, signer: PrivateKeyWallet): Promise<string> {
  const allBalances = await signer.nodeProvider.addresses.getAddressesAddressBalance(address)
  const tokenBalance = allBalances.tokenBalances?.find((t) => t.id === token)?.amount
  if (!tokenBalance) {
    return '0'
  } else {
    return tokenBalance
  }
}
