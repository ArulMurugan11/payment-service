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
import {each, groupBy, map} from 'lodash';
import {logInvocation} from '../decorator';
import {FilterInterface, KeyValue} from '../interface/common';
import {API_PREFIX, LoggingBindings, MONTHS} from '../key';
import {Transaction} from '../models';
import {
  TransactionRepository,
  TransferRepository,
  WalletAuditRepository,
  WalletRepository,
} from '../repositories';
import {IndulgeRestService} from '../services/indulge.service';
import {htmlTemplate} from '../template/template.html';
const qs = require('qs');
const easyinvoice = require('easyinvoice');
const fs = require('fs');
//const btoa = require('btoa');
//const ejs = require('ejs');
//const pdf = require('html-pdf');

export class TransactionController {
  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @repository(WalletRepository)
    public walletRepository: WalletRepository,
    @repository(WalletAuditRepository)
    public WalletAuditRepository: WalletAuditRepository,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
    @inject(RestBindings.Http.RESPONSE)
    public res: Response,
    @repository(TransferRepository)
    public transferRepository: TransferRepository,
    @inject(RestBindings.Http.REQUEST)
    public request: Request,
    @inject('services.IndulgeService')
    protected indulgeRestService: IndulgeRestService,
  ) {}

  @authenticate('jwt')
  @logInvocation()
  @post(`${API_PREFIX}/transactions`)
  @response(200, {
    description: 'Transaction model instance',
    content: {'application/json': {schema: getModelSchemaRef(Transaction)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transaction, {
            title: 'NewTransaction',
            exclude: ['transactionId'],
          }),
        },
      },
    })
    transaction: Omit<Transaction, 'transactionId'>,
  ): Promise<Transaction> {
    const user = this.res?.locals?.user;
    const walletExist = await this.walletRepository.findOne({
      where: {
        userId: user.userId,
      },
    });
    if (!walletExist) {
      throw new HttpErrors.Forbidden('Wallet Not Found');
    }
    const walletBalance = Number(walletExist.balance);
    const transactionAmount = Number(transaction.amount);
    if (transactionAmount > walletBalance) {
      //throw error
      throw new HttpErrors.BadRequest(
        'The Transaction Amount is Exceeded your Balance',
      );
    }
    const updatedBalance = String(
      Number(walletExist.balance) - Number(transaction.amount),
    );
    await this.walletRepository.updateById(walletExist.walletId, {
      ...walletExist,
      balance: updatedBalance,
    });
    const savedTransaction = await this.transactionRepository.create(
      transaction,
    );
    await this.WalletAuditRepository.create({
      balance: updatedBalance,
      transactionId: savedTransaction.transactionId,
      userId: savedTransaction.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return savedTransaction;
  }

  @logInvocation()
  @get(`${API_PREFIX}/transactions/count`)
  @response(200, {
    description: 'Transaction model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Transaction) where?: Where<Transaction>,
  ): Promise<Count> {
    return this.transactionRepository.count(where);
  }

  @logInvocation()
  @get(`${API_PREFIX}/transactions`)
  @response(200, {
    description: 'Array of Transaction model instances',
    content: {
      'application/json': {
        // schema: {
        //   type: 'array',
        //   items: getModelSchemaRef(Transaction, {includeRelations: true}),
        // },
        schema: {
          type: 'string',
        },
      },
    },
  })
  async find(
    @param.filter(Transaction) filter?: Filter<Transaction>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // const {user} = this.res.locals;
    const transactions = await this.transactionRepository.find(filter);
    // const transactions = await this.transactionRepository.find({
    //   where: {
    //     userId: user.userId,
    //     status: 'success',
    //   },
    //   order: ['createdAt DESC'],
    // });

    const orderIds = map(transactions, 'orderId');
    const queryFilter: FilterInterface = {
      populate: ['category', 'category.logo'],
      filters: {
        in: orderIds,
      },
    };
    const orders = await this.indulgeRestService.getOrders(
      this.request?.headers?.authorization ?? '',
      qs.stringify(queryFilter, {
        encodeValuesOnly: true,
      }),
    );
    const groupedOrders = groupBy(orders, 'orderId');
    const resp: KeyValue[] = [];
    each(transactions, transaction => {
      const order = groupedOrders[transaction.orderId]?.[0];
      const product = order?.product ?? {};
      const productId = order?.product?.id;
      const category = product?.category;
      const respTran = {
        ...transaction,
        currencySymbol: '₹',
        order: {
          orderId: order.orderId,
          status: order.status,
          additionalInfo: order.additionalInfo,
          createdAt: order.createdAt,
          ticketId: order.ticketId,
          conversationId: order.conversationId,
          product: {
            productId,
            images: product?.images,
            price: product.price,
            discountPrice: product.discount_price,
            title: product.title,
            currency: product.currency,
            currencySymbol: '₹',
            category,
          },
        },
        // fullOrder: order,
      };
      resp.push(respTran);
    });
    const groupedTransactions: KeyValue = {};
    each(resp, transaction => {
      const date = new Date(transaction.createdAt);
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      if (!groupedTransactions[key]) {
        groupedTransactions[key] = {
          total: 0,
          currencyType: transaction.currencyType,
          data: [],
        };
      }
      groupedTransactions[key].total += Number(transaction.amount);
      groupedTransactions[key].data.push(transaction);
    });

    return groupedTransactions;
  }

  @logInvocation()
  @get(`${API_PREFIX}/transactions/downloadtxn`)
  @response(200, {
    description: 'Array of Transaction model instances',
    content: {
      'application/json': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async downloadTxn(
    //@param.path.string('role') role: string,
    @param.filter(Transaction) filter?: Filter<Transaction>,
  ): Promise<any> {
    const user = this.res?.locals?.user;
    const userRole = user.roles.name;
    console.log('///////////////////////////////');
    console.log(user);
    console.log(__dirname);
    console.log('//////////////////////////');
    // if (userRole == 'customer') {
    // const buff = new Buffer(htmlTemplate);
    ('use strict');
    const buff = new Buffer(htmlTemplate);
    const base64data = buff.toString('base64');
    const userWalletAudit = await this.WalletAuditRepository.find({
      where: {
        userId: user.userId,
      },
    });
    // Our new data object, this will replace the empty object we used earlier.
    var data = {
      customize: {
        base64data,
      },
    };
    easyinvoice.createInvoice(data, function (result: any) {
      /*
          5.  The 'result' variable will contain our invoice as a base64 encoded PDF
              Now let's save our invoice to our local filesystem so we can have a look!
              We will be using the 'fs' library we imported above for this.
      */
      fs.writeFileSync('Statement.pdf', result.pdf, 'base64');
    });
    return userWalletAudit;
  }

  @logInvocation()
  @patch(`${API_PREFIX}/transactions`)
  @response(200, {
    description: 'Transaction PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transaction, {partial: true}),
        },
      },
    })
    transaction: Transaction,
    @param.where(Transaction) where?: Where<Transaction>,
  ): Promise<Count> {
    return this.transactionRepository.updateAll(transaction, where);
  }

  @logInvocation()
  @get(`${API_PREFIX}/transactions/{id}`)
  @response(200, {
    description: 'Transaction model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Transaction, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Transaction, {exclude: 'where'})
    filter?: FilterExcludingWhere<Transaction>,
  ): Promise<Transaction> {
    return this.transactionRepository.findById(id, filter);
  }

  @logInvocation()
  @patch(`${API_PREFIX}/transactions/{id}`)
  @response(204, {
    description: 'Transaction PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transaction, {partial: true}),
        },
      },
    })
    transaction: Transaction,
  ): Promise<void> {
    await this.transactionRepository.updateById(id, transaction);
  }

  @logInvocation()
  @put(`${API_PREFIX}/transactions/{id}`)
  @response(204, {
    description: 'Transaction PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() transaction: Transaction,
  ): Promise<void> {
    await this.transactionRepository.replaceById(id, transaction);
  }

  @logInvocation()
  @del(`${API_PREFIX}/transactions/{id}`)
  @response(204, {
    description: 'Transaction DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.transactionRepository.deleteById(id);
  }
}
