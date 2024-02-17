import { expect, describe, it, beforeAll, beforeEach, test } from 'bun:test'
import {
  web3,
  Project,
  Token,
  DUST_AMOUNT,
  ONE_ALPH,
  hexToString,
  stringToHex,
  TestContractParams,
  addressFromContractId,
  sleep
} from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { Balance } from '@alephium/web3/dist/src/api/api-alephium'
import {
  testNodeWallet,
  getSigners,
  transfer,
  testAddress,
  randomContractId,
  expectAssertionError
} from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { RandomNumberGenerator } from '../artifacts/ts'

describe('RandomNumberGenerator', async () => {
  let rngContractAddress

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    const deployments = await deployToDevnet()

    const rngDeployed = deployments.getDeployedContractResult(0, 'RandomNumberGenerator')
    if (rngDeployed === undefined) {
      console.log(`The contract is not deployed on group 0`)
    }

    rngContractAddress = rngDeployed?.contractInstance.address
    console.log('>>> ***** <<<<')
  })

  it('should get random number', async () => {
    const rngState = RandomNumberGenerator.at(rngContractAddress)
    let randomNumber
    for (let i = 0; i < 20; i++) {
      randomNumber = await rngState.methods.getRandomNumber({ args: { userHash_: stringToHex(`Test`) } })

      console.log('random number ', randomNumber.returns % 20n)
    }
  })
})
