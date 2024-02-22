import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction } from '@alephium/cli'
import { RandomNumberGenerator } from '../artifacts/ts'

const deployRandomNumberGenerator: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const initialFields = {
    randomHash: stringToHex('')
  }

  const result = await deployer.deployContract(RandomNumberGenerator, {
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`RandomNumberGenerator Contract Address: ${contractAddress}`)
  console.log(`RandomNumberGenerator Contract Id: ${contractId}`)
}

export default deployRandomNumberGenerator
