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
  HttpErrors,
  param,
  patch,
  post,
  put,
  Request,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {each} from 'lodash';
import {logInvocation} from '../decorator';
import {KeyValue} from '../interface/common';
import {API_PREFIX, LoggingBindings, MONTHS, PaymentGateWay} from '../key';
import {Transfer, TransferStatus} from '../models';
import {
  TransferRepository,
  WalletAuditRepository,
  WalletRepository,
} from '../repositories';

const Razorpay = require('razorpay');
const razorPay = new Razorpay({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  key_id: PaymentGateWay.KeyId,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  key_secret: PaymentGateWay.secret,
});
@authenticate('jwt')
export class TransferController {
  constructor(
    @repository(TransferRepository)
    public transferRepository: TransferRepository,
    @repository(WalletRepository)
    public walletRepository: WalletRepository,
    @repository(WalletAuditRepository)
    public WalletAuditRepository: WalletAuditRepository,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
    @inject(RestBindings.Http.RESPONSE)
    public res: Response,
    @inject(RestBindings.Http.REQUEST)
    public request: Request,
  ) {}

  @logInvocation()
  @post(`${API_PREFIX}/razorpay/topup/init`)
  @response(200, {
    description: 'Initialize top up',
    content: {
      'application/json': {
        schema: {
          id: {
            type: 'string',
          },
        },
      },
    },
  })
  async initiateTopup(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['amount', 'currency'],
            properties: {
              amount: {
                type: 'string',
              },
              currency: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    topupData: {
      amount: string;
      currency: string;
    },
  ): Promise<{
    id: string;
  }> {
    const user = this.res?.locals?.user;
    const customer = await razorPay.customers.fetch(user.paymentGatewayId);
    const order = await razorPay.orders.create({
      amount: topupData.amount,
      currency: topupData.currency,
      notes: {
        customerId: customer.id,
        userId: user.userId,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
      },
    });
    return {
      id: order.id,
    };
  }

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
          schema: {
            type: 'object',
            required: ['paymentId', 'orderId', 'signature'],
            properties: {
              paymentId: {
                type: 'string',
              },
              orderId: {
                type: 'string',
              },
              signature: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    paymentGatewayResponse: {
      signature: string;
      orderId: string;
      paymentId: string;
    },
  ): Promise<Transfer> {
    const user = this.res?.locals?.user;
    // fetch the customer frm the razor pay
    const customer = await razorPay.customers.fetch(user.paymentGatewayId);
    // retrieve the payment and order detail
    const payment = await razorPay.payments.fetch(
      paymentGatewayResponse.paymentId,
    );
    const order = await razorPay.orders.fetch(paymentGatewayResponse.orderId);
    // Check if the payment id has a transfer record
    const existingPaymentTransfer = await this.transferRepository.findOne({
      where: {
        paymentId: payment.id,
      },
    });

    if (existingPaymentTransfer) {
      throw new HttpErrors.Forbidden('The request is already processed');
    }
    const date = new Date().toISOString();
    // create transfer data
    const transfer = {
      status: payment.status,
      paymentId: payment.id,
      currency: payment.currency,
      amount: payment.amount,
      rawResponse: JSON.stringify({
        order,
        payment,
        customerId: customer.id,
      }),
      userId: user.userId,
      mode: payment.method,
      receipt: order.receipt,
      createdAt: date,
      updatedAt: date,
    };
    // save transfer
    const savedTransfer = await this.transferRepository.create(transfer);
    // if success update the wallet
    if (transfer.status !== TransferStatus.CAPTURED) {
      throw new HttpErrors.Forbidden(
        'Please make the payment and try accessing the api',
      );
    }
    // update wallet
    let wallet = await this.walletRepository.findOne({
      where: {
        userId: transfer.userId,
      },
    });
    if (!wallet) {
      wallet = await this.walletRepository.create({
        userId: transfer.userId,
        balance: transfer.amount,
        createdAt: savedTransfer.createdAt,
        updatedAt: savedTransfer.updatedAt,
      });
    } else {
      wallet.balance = String(Number(wallet.balance) + Number(transfer.amount));
      await this.walletRepository.updateById(wallet.walletId, {
        ...wallet,
        balance: wallet.balance,
      });
    }
    await this.WalletAuditRepository.create({
      balance: wallet.balance,
      transferId: savedTransfer.transferId,
      userId: savedTransfer.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return savedTransfer;
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
    @param.query.number('userId') userId: Number,
    @param.filter(Transfer) filter?: Filter<Transfer>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // const {user} = this.res.locals;
    const transfers = await this.transferRepository.find(filter);
    // const transfers = await this.transferRepository.find({
    //   where: {
    //     userId: Number(userId) ?? user.userId,
    //     status: TransferStatus.CAPTURED,
    //   },
    //   order: ['createdAt DESC'],
    // });
    const groupedTransfers: KeyValue = {};
    each(transfers, transfer => {
      const date = new Date(transfer.createdAt);
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      if (!groupedTransfers[key]) {
        groupedTransfers[key] = {
          total: 0,
          currencyType: transfer.currency,
          data: [],
        };
      }
      groupedTransfers[key].total += Number(transfer.amount) / 100;
      groupedTransfers[key].data.push(transfer);
    });
    return groupedTransfers;
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
    const transferById = await this.transferRepository.findById(id, filter);
    if (!transferById) {
      throw new HttpErrors.NotFound('Transfer Not Exist');
    }
    transferById.amount = String(Number(transferById.amount) / 100);
    return transferById;
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
