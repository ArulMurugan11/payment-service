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
  Request,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import _ from 'lodash';
import {logInvocation} from '../decorator';
import {FilterInterface} from '../interface/common';
import {API_PREFIX, LoggingBindings, MONTHS} from '../key';
import {Transaction} from '../models';
import {TransactionRepository} from '../repositories';
import {IndulgeRestService} from '../services/indulge.service';
const qs = require('qs');
export class TransactionController {
  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
    @inject(RestBindings.Http.RESPONSE)
    public res: Response,
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
            exclude: ['transaction_id'],
          }),
        },
      },
    })
    transaction: Omit<Transaction, 'transaction_id'>,
  ): Promise<Transaction> {
    return this.transactionRepository.create(transaction);
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
  ): Promise<any> {
    const {user} = this.res.locals;
    const transactions = await this.transactionRepository.find({
      where: {
        userId: user.userId,
        status: 'success',
      },
    });

    const orderIds = _.map(transactions, 'orderId');
    const queryFilter: FilterInterface = {
      populate: '*',
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
    //console.log('************************' + JSON.stringify(orders));

    const groupedOrders = _.groupBy(orders, 'orderId');
    // console.log('***********************' + JSON.stringify(groupedOrders));
    const resp: {
      order: any;
      transaction_id?: number | undefined;
      status: string;
      raw_response?: string | undefined;
      ticket_id: number;
      userId: number;
      orderId: number;
      bucketListId: number;
      createdAt: string;
      updatedAt: string;
    }[] = [];
    _.each(transactions, transaction => {
      const respTran = {
        ...transaction,
        order:
          groupedOrders[transaction.orderId] &&
          groupedOrders[transaction.orderId][0],
      };
      resp.push(respTran);
    });
    // console.log(
    //   '***********************' +
    //     JSON.stringify(iteratetrans) +
    //     '*************************',
    // );
    const groupedTransactions = _.groupBy(resp, ({createdAt}) => {
      const date = new Date(createdAt);
      return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    });

    return groupedTransactions;
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
