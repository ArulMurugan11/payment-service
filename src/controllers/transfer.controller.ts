import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {WinstonLogger} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';
import {logInvocation} from '../decorator';
import {API_PREFIX, LoggingBindings} from '../key';
import {Transfer} from '../models';
import {TransferRepository, WalletRepository} from '../repositories';

@authenticate('jwt')
export class TransferController {
  constructor(
    @repository(TransferRepository)
    public transferRepository: TransferRepository,
    @repository(WalletRepository)
    public walletRepository: WalletRepository,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
  ) {}

  @logInvocation()
  @post(`${API_PREFIX}/transfers`)
  @response(200, {
    description: 'Transfer model instance',
    content: {'application/json': {schema: getModelSchemaRef(Transfer)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transfer, {
            title: 'NewTransfer',
            exclude: ['transferId'],
          }),
        },
      },
    })
    transfer: Omit<Transfer, 'transferId'>,
  ): Promise<Transfer> {
    const savedTransfer = await this.transferRepository.create(transfer);
    const wallet = await this.walletRepository.findOne({
      where: {
        userId: transfer.userId,
      },
    });
    if (!wallet) {
      await this.walletRepository.create({
        userId: transfer.userId,
        balance: transfer.amount,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      });
      return savedTransfer;
    } else {
      const totalBalance = Number(wallet.balance) + Number(transfer.amount);
      const updatedWallet = String(totalBalance);
      await this.walletRepository.updateById(wallet.walletId, {
        ...wallet,
        balance: updatedWallet,
      });
      return savedTransfer;
    }
  }
}
