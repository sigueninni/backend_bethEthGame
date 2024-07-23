import { Injectable } from '@nestjs/common';
import { Address, createPublicClient, http, formatUnits, createWalletClient, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import * as gameJson from './assets/BetEthGame.json';
import * as tokenJson from './assets/BethEthToken.json';
import { privateKeyToAccount } from 'viem/accounts';
import { from } from 'rxjs';


const MAXUINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;


@Injectable()
export class AppService {

  publicClient;
  walletClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_ENDPOINT_URL),
    });

    const deployerPrivateKey = process.env.PRIVATE_KEY || '';
    const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
    this.walletClient = createWalletClient({
      account: privateKeyToAccount(`0x${deployerPrivateKey}`),
      chain: sepolia,
      transport: http(process.env.RPC_ENDPOINT_URL)
    });

  }


  getHello(): string {
    return 'Hello World!';
  }

  getContractAddress(): Address {
    return process.env.BET_ETH_GAME_ADDRESS as Address;
  }

  async getTokenName(): Promise<any> {

    const name = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "name"
    });
    return name;
  }

  async getTotalSupply() {

    const totalSupply = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "totalSupply"
    });


    const symbol = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "symbol"
    });

    const decimals = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "decimals"
    });

    const balanceString = `${formatUnits(totalSupply, decimals)} ${symbol}`;
    return balanceString;


  }

  async getTransactionReceipt(hash: string) {
    const transactionReceipt = await this.publicClient.getTransactionReceipt({
      hash
    });

    const transactionReceiptString = `${transactionReceipt.status}`;
    console.log({ transactionReceipt });
    return transactionReceiptString;
  }

  async getTokenBalance(address: string) {

    const balance = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "balanceOf",
      args: [address]
    });

    const symbol = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "symbol"
    });

    const decimals = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "decimals"
    });

    const balanceString = `${formatUnits(balance, decimals)} ${symbol}`;
    return balanceString;

  }


  getServerWalletAddress() {
    console.log(this.walletClient.account.address);
    return this.walletClient.account.address;
  }


  //State bets game
  async areBetsOpen() {
    const betsOpen = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "betsOpen"
    });

    return betsOpen ? 'Bets are open ' : 'Bets are closed';

  }


  async openBets() {

    const openBetsTx = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "openBets",
      from: this.getServerWalletAddress()
    })

    console.log("openBetsTx response: ", openBetsTx)

    const openBetsTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: openBetsTx })

    console.log("openBetsTxReceipt: ", openBetsTxReceipt)

    return openBetsTxReceipt.status;


  }

  async closeBets() {

    const closeBetsTx = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "closeBets",
      from: this.getServerWalletAddress()
    })

    console.log("closeBetsTx response: ", closeBetsTx)

    const closeBetsTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: closeBetsTx })

    console.log("closeBetsTxReceipt: ", closeBetsTxReceipt)

    return closeBetsTxReceipt.status;
  }



  async approve(address: `0x${string}`) {

    const contractAddress = this.getContractAddress();

    const tokenAddress = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "bethEthToken"
    })

    console.log("BethEthToken: ", tokenAddress)

    const allowTx = await this.walletClient.writeContract({
      address: tokenAddress,
      abi: tokenJson.abi,
      functionName: "approve",
      args: [contractAddress, MAXUINT256],
      from: address
    })

    console.log("allowTX response: ", allowTx)

    const allowTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: allowTx })

    console.log("allowTxReceipt: ", allowTxReceipt)

    return allowTxReceipt.status;

  }

  async buyTokens(amount: string) {
    await this.approve(this.walletClient.address);

    const buyTokensTx = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "purchaseTokens",
      from: this.getServerWalletAddress(),
      value: parseEther(amount)
    });

    console.log("buyTokensTx response: ", buyTokensTx)

    const buyTokensTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: buyTokensTx })

    console.log("buyTokensTxReceipt: ", buyTokensTxReceipt)

    return buyTokensTxReceipt.status;
  }

  async bet(prediction: string) {
    const betTx = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "bet",
      from: this.getServerWalletAddress(),
      //value: parseEther(amount),
      args: [prediction]
    })

    console.log("betTx response: ", betTx)

    const betTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: betTx })

    console.log("betTxReceipt: ", betTxReceipt)

    return betTxReceipt.status;
  }


  async setWinner() {
    const setWinnerTx = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "setWinner",
      from: this.getServerWalletAddress(),
    });

    console.log("setWinnerTx response: ", setWinnerTx)

    const setWinnerTxReceipt = await this.publicClient.waitForTransactionReceipt({ hash: setWinnerTx })

    console.log("setWinnerTxReceipt: ", setWinnerTxReceipt)

    return setWinnerTxReceipt.status;
  }


  async getWinner() {
    const winner = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "winner"
    });

    return winner;
  }

  async getEthUsdPrice() {
    const getEthUsdPrice = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "getEthUsdPrice"
    });

    const ethUsdPrice = `${getEthUsdPrice}`;
    return ethUsdPrice;
  }



}
