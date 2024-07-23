import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { BuyTokenDto } from './dtos/buyTokens.dto';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('contract-address')
  getContractAddress() {
    return { result: this.appService.getContractAddress() };
  }

  @Get('token-name')
  async getTokenName() {
    return { result: await this.appService.getTokenName() };
  }

  @Get('total-supply')
  async getTotalSupply() {
    return { result: await this.appService.getTotalSupply() };
  }

  @Get('token-balance/:address')
  async getTokenBalance(@Param('address') address: string) {
    return { result: await this.appService.getTokenBalance(address) };
  }

  @Get('transaction-receipt')
  async getTransactionReceipt(@Query('hash') hash: string) {
    return { result: await this.appService.getTransactionReceipt(hash) };
  }


  @Get('server-wallet-address')
  getServerWalletAddress() {
    return { result: this.appService.getServerWalletAddress() };
  }


  @Get('are-bets-open')
  async areBetsOpen() {
    return { result: await this.appService.areBetsOpen() };
  }


  @Post('open-bets')
  async openBets() {
    return { result: await this.appService.openBets() };
  }

  @Post('close-bets')
  async closeBets() {
    return { result: await this.appService.closeBets() };
  }



  @Post('buy-tokens')
  async mintTokens(@Body() body: BuyTokenDto) {
    return { result: await this.appService.buyTokens(body.amount) };
  }

}
