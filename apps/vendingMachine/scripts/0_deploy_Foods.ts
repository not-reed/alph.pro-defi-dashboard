import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction } from '@alephium/cli'
import { Foods } from '../artifacts/ts'

const deployFoods: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex(''),
    tokenUri: stringToHex(''),
    nftIndex: 0n
  }

  const result = await deployer.deployContract(Foods, {
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`Foods Contract Address: ${contractAddress}`)
  console.log(`Foods Contract Id: ${contractId}`)
}

export default deployFoods
