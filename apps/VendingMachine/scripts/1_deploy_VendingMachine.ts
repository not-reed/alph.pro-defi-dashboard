import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction } from '@alephium/cli'
import { VendingMachine } from '../artifacts/ts'

const mintedFoods = new Array<bigint>(20).fill(0n) as [bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint]

const deployVendingMachine: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const foodResults = deployer.getDeployContractResult('Foods')

  const initialFields = {
    foodsContractId: foodResults.contractInstance.contractId,
    collectionOwner: deployer.account.address,
    collectionUri: stringToHex(''),
    nftBaseUri: stringToHex(''),
    totalSupply: 0n,
    mintIsPaused: true, // true
    mintedFoods: mintedFoods
  }

  const result = await deployer.deployContract(VendingMachine, {
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`VendingMachine Contract Address: ${contractAddress}`)
  console.log(`VendingMachine Contract Id: ${contractId}`)
}

export default deployVendingMachine
