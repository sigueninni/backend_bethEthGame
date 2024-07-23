import { Injectable } from '@nestjs/common';
import { Address, createPublicClient, http, formatUnits, createWalletClient, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import * as gameJson from './assets/BetEthGame.json';
import * as tokenJson from './assets/BethEthToken.json';
import { privateKeyToAccount } from 'viem/accounts';


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

    const response = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "openBets",
      from: this.getServerWalletAddress()
    })

    return response;
  }

  async closeBets() {
    const response = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "closeBets",
      from: this.getServerWalletAddress()
    })

    return response;
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

    return allowTxReceipt;

  }

  async buyTokens(amount: string) {
    await this.approve(this.walletClient.address);
    const response = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "purchaseTokens",
      from: this.getServerWalletAddress(),
      value: parseEther(amount)
    })

    return response;
  }

  async bet(prediction: string) {
    const response = await this.walletClient.writeContract({
      address: this.getContractAddress(),
      abi: gameJson.abi,
      functionName: "bet",
      from: this.getServerWalletAddress(),
      //value: parseEther(amount),
      args: [prediction]
    })

    return response;
  }

}
