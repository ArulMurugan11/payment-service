import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {WinstonLogger} from '@loopback/logging';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
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

  @logInvocation()
  @get(`${API_PREFIX}/transfers/count`)
  @response(200, {
    description: 'Transfer model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Transfer) where?: Where<Transfer>): Promise<Count> {
    return this.transferRepository.count(where);
  }

  @logInvocation()
  @get(`${API_PREFIX}/transfers`)
  @response(200, {
    description: 'Array of Transfer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Transfer, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Transfer) filter?: Filter<Transfer>,
  ): Promise<Transfer[]> {
    return this.transferRepository.find(filter);
  }

  @logInvocation()
  @patch(`${API_PREFIX}/transfers`)
  @response(200, {
    description: 'Transfer PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transfer, {partial: true}),
        },
      },
    })
    transfer: Transfer,
    @param.where(Transfer) where?: Where<Transfer>,
  ): Promise<Count> {
    return this.transferRepository.updateAll(transfer, where);
  }

  @logInvocation()
  @get(`${API_PREFIX}/transfers/{id}`)
  @response(200, {
    description: 'Transfer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Transfer, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Transfer, {exclude: 'where'})
    filter?: FilterExcludingWhere<Transfer>,
  ): Promise<Transfer> {
    return this.transferRepository.findById(id, filter);
  }

  @logInvocation()
  @patch(`${API_PREFIX}/transfers/{id}`)
  @response(204, {
    description: 'Transfer PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transfer, {partial: true}),
        },
      },
    })
    transfer: Transfer,
  ): Promise<void> {
    await this.transferRepository.updateById(id, transfer);
  }

  @logInvocation()
  @put(`${API_PREFIX}/transfers/{id}`)
  @response(204, {
    description: 'Transfer PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() transfer: Transfer,
  ): Promise<void> {
    await this.transferRepository.replaceById(id, transfer);
  }

  @logInvocation()
  @del(`${API_PREFIX}/transfers/{id}`)
  @response(204, {
    description: 'Transfer DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.transferRepository.deleteById(id);
  }
}
