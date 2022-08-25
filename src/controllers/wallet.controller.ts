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
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  response,
} from '@loopback/rest';
import {logInvocation} from '../decorator';
import {API_PREFIX, LoggingBindings} from '../key';
import {Wallet} from '../models';
import {WalletRepository} from '../repositories';

@authenticate('jwt')
export class WalletController {
  constructor(
    @repository(WalletRepository)
    public walletRepository: WalletRepository,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
  ) {}

  @logInvocation()
  @get(`${API_PREFIX}/wallets/count`)
  @response(200, {
    description: 'Wallet model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Wallet) where?: Where<Wallet>): Promise<Count> {
    return this.walletRepository.count(where);
  }

  @logInvocation()
  @get(`${API_PREFIX}/wallets`)
  @response(200, {
    description: 'Array of Wallet model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Wallet, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Wallet) filter?: Filter<Wallet>): Promise<Wallet> {
    const wallets = await this.walletRepository.findOne(filter);
    if (!wallets) {
      throw new HttpErrors.NotFound('Wallet Not Exist');
    }
    wallets.balance = String(Number(wallets.balance) / 100);
    return wallets;
  }

  @logInvocation()
  @get(`${API_PREFIX}/wallets/{id}`)
  @response(200, {
    description: 'Wallet model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Wallet, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Wallet, {exclude: 'where'})
    filter?: FilterExcludingWhere<Wallet>,
  ): Promise<Wallet> {
    const walletById = await this.walletRepository.findById(id, filter);
    if (!walletById) {
      throw new HttpErrors.NotFound('Wallet Not Exist');
    }
    walletById.balance = String(Number(walletById.balance) / 100);
    return walletById;
  }

  // @logInvocation()
  // @get(`${API_PREFIX}/wallet/{userId}`)
  // @response(200, {
  //   description: 'Array of Wallet model instances',
  //   content: {
  //     'application/json': {
  //       schema: {
  //         type: 'array',
  //         items: getModelSchemaRef(Wallet, {includeRelations: true}),
  //       },
  //     },
  //   },
  // })
  // async findByUserId(
  //   @param.path.number('userId') userId: number,
  //   @param.filter(Wallet)
  //   filter?: Filter<Wallet>,
  // ): Promise<Wallet> {
  //   const userWallet = await this.walletRepository.findOne({
  //     where: {
  //       userId: userId,
  //     },
  //   });
  //   if (!userWallet) {
  //     throw new HttpErrors.Forbidden('Wallet Not Found');
  //   }
  //   return userWallet;
  // }
  @logInvocation()
  @get(`${API_PREFIX}/wallet/{userId}`)
  @response(200, {
    description: 'Wallet model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Wallet, {includeRelations: true}),
      },
    },
  })
  async findByUserId(
    @param.path.number('userId') userId: number,
    @param.filter(Wallet)
    filter?: Filter<Wallet>,
  ): Promise<Wallet> {
    filter = {
      where: {
        userId,
      },
    };
    const userWallet = await this.walletRepository.findOne(filter);
    if (!userWallet) {
      throw new HttpErrors.Forbidden('Wallet Not Found');
    }
    userWallet.balance = String(Number(userWallet.balance) / 100);
    return userWallet;
  }
}
