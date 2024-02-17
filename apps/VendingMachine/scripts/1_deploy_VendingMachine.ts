import { hexToString, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction } from '@alephium/cli'
import { VendingMachine } from '../artifacts/ts'

const deployVendingMachine: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const vendingMachineResults = deployer.getDeployContractResult('VendingMachine')

  const initialFields = {
    foodsContractId: vendingMachineResults.contractInstance.contractId,
    collectionOwner: deployer.account.address,
    collectionUri: Buffer.from('Vending Machine', 'utf8').toString('hex'),
    nftBaseUri: stringToHex(''),
    totalSupply: 0n,
    mintIsPaused: true // true
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
