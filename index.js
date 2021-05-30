const { ethers, BigNumber } = require('ethers')
const fs = require('fs')

require('dotenv').config()

const {
  USDC_CONTRACT_ADDRESS,
  VOTE_CONTRACT_ADDRESS,
  MNEMONIC,
  SOTA_ID,
  VOTE_COUNT,
  MONEY,
} = process.env

const provider = new ethers.providers.getDefaultProvider(
  'https://bsc-dataseed.binance.org/',
)

// const provider = new ethers.providers.getDefaultProvider(
//   'https://data-seed-prebsc-1-s1.binance.org:8545/',
// )

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const formatEther = (balance) => {
  return ethers.utils.formatEther(balance)
}

const bep20abi = JSON.parse(fs.readFileSync('bep20abi.json'))

const adminWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(provider)

const USDCContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, bep20abi)

const voteabi = [
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: 'dareId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'vote',
    outputs: [],
    type: 'function',
    payable: false,
    stateMutability: 'nonpayable',
  },
]

const voteContract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, voteabi)

const getBNBBalance = async (wallet) => {
  const result = await wallet.getBalance()
  return formatEther(result)
}

const getUSDCBalance = async (wallet) => {
  const newContract = USDCContract.connect(wallet)
  const result = await newContract['balanceOf(address)'](wallet.address)
  return ethers.utils.formatEther(result)
}

const transferBNB = async (wallet, to, amount) => {
  const result = await wallet.sendTransaction({
    to: to,
    value: ethers.utils.parseEther(amount),
  })
  return result
}

const transferUSDC = async (wallet, to, amount) => {
  const newContract = USDCContract.connect(wallet)
  const result = await newContract['transfer(address,uint256)'](
    to,
    ethers.utils.parseEther(amount),
  )
  return result
}

const approveUSDC = async (wallet, spender, amount) => {
  const newContract = USDCContract.connect(wallet)
  const result = await newContract['approve(address,uint256)'](
    spender,
    ethers.utils.parseEther(amount),
  )
  return result
}

const vote = async (wallet) => {
  const newContract = voteContract.connect(wallet)
  const result = await newContract['vote(uint256,uint256)'](
    BigNumber.from(`0x${SOTA_ID}`),
    VOTE_COUNT,
  )
  return result
}

const getTransaction = async (transactionHash) => {
  const transaction = await provider.getTransaction(transactionHash)
  console.log(transaction)
  return transaction
}

const ultimate = async () => {
  console.log('CREATE CLONE WALLET')
  const cloneWallet = new ethers.Wallet.createRandom().connect(provider)
  console.log(`Address: ${cloneWallet.address}`)
  console.log(`Private key: ${cloneWallet.privateKey}`)
  console.log('--------------------------')
  console.log('GET MASTER BALANCE')
  console.log(`BNB: ${await getBNBBalance(adminWallet)}`)
  console.log(`USDC: ${await getUSDCBalance(adminWallet)}`)
  console.log('--------------------------')
  console.log('TRANSFER TO CLONE')
  const transBNB = await transferBNB(adminWallet, cloneWallet.address, '0.001')
  console.log(transBNB)
  console.log(`transBNB hash: ${transBNB.hash}`)
  const transUSDC = await transferUSDC(adminWallet, cloneWallet.address, MONEY)
  console.log(transUSDC)
  console.log(`transUSDC hash: ${transUSDC.hash}`)
  while (1) {
    await sleep(5000)
    let bnbTx = await getTransaction(transBNB.hash)
    let usdcTx = await getTransaction(transUSDC.hash)
    if (bnbTx.blockNumber && usdcTx.blockNumber) {
      console.log('Transfer success')
      break
    }
  }
  console.log('--------------------------')
  console.log('GET ClONE BALANCE')
  console.log(`BNB: ${await getBNBBalance(cloneWallet)}`)
  console.log(`USDC: ${await getUSDCBalance(cloneWallet)}`)
  console.log('--------------------------')
  console.log('APPROVE VOTE CONTRACT TO USE USDC')
  const approve = await approveUSDC(cloneWallet, VOTE_CONTRACT_ADDRESS, MONEY)
  console.log(approve)
  console.log(approve.hash)
  while (1) {
    await sleep(5000)
    let approveTx = await getTransaction(approve.hash)
    if (approveTx.blockNumber) {
      console.log('Approve success')
      break
    }
  }
  console.log('--------------------------')
  const votee = await vote(cloneWallet)
  console.log(votee)
  console.log(votee.hash)
  while (1) {
    await sleep(5000)
    let voteTx = await getTransaction(votee.hash)
    if (voteTx.blockNumber) {
      console.log('Vote success')
      break
    }
  }
  console.log('--------------------------')
  console.log('TRANSFER BACK MONEY TO MASTER')
  const cloneBalance = await getBNBBalance(cloneWallet)
  console.log(`BNB: ${cloneBalance}`)
  const back = await cloneWallet.sendTransaction({
    to: adminWallet.address,
    value: ethers.utils
      .parseUnits(cloneBalance, 'ether')
      .sub(ethers.utils.parseUnits((5 * 21000).toString(), 'gwei')),
    gasPrice: ethers.utils.parseUnits('5', 'gwei'),
    gasLimit: BigNumber.from('21000'),
  })
  console.log(back)
  while (1) {
    await sleep(5000)
    let resTx = await getTransaction(back.hash)
    if (resTx.blockNumber) {
      console.log('transfer back success')
      break
    }
  }
  console.log('--------------------------')
  console.log('GET MASTER BALANCE')
  console.log(`BNB: ${await getBNBBalance(adminWallet)}`)
  console.log(`USDC: ${await getUSDCBalance(adminWallet)}`)
  console.log('--------------------------')
  console.log('DONE')
}

const main = async () => {
  for (let index = 0; index < 20; index++) {
    console.log(`round ${index}`);
    await ultimate()
  }
}

// ultimate2()

main()
