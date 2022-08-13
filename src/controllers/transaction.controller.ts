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
    const userWalletAudit = await this.WalletAuditRepository.find({
      where: {
        userId: user.userId,
      },
    });
    // Our new data object, this will replace the empty object we used earlier.
    var data = {
      // Let's add a recipient
      client: {
        company: 'Client Corp',
        address: 'Clientstreet 456',
        zip: '4567 CD',
        city: 'Clientcity',
        country: 'Clientcountry',
      },

      // Now let's add our own sender details
      sender: {
        company: 'Sample Corp',
        address: 'Sample Street 123',
        zip: '1234 AB',
        city: 'Sampletown',
        country: 'Samplecountry',
      },

      // Of course we would like to use our own logo and/or background on this invoice. There are a few ways to do this.
      images: {
        //      Logo:
        // 1.   Use a url
        logo: 'https://public.easyinvoice.cloud/img/logo_en_original.png',
        /*
         2.   Read from a local file as base64
              logo: fs.readFileSync('logo.png', 'base64'),
         3.   Use a base64 encoded image string*/
      },

      // Let's add some standard invoice data, like invoice number, date and due-date
      information: {
        // Invoice number
        number: '2021.0001',
        // Invoice data
        date: '12-12-2021',
        // Invoice due date
        'due-date': '31-12-2021',
      },

      // Now let's add some products! Calculations will be done automatically for you.
      products: [
        {
          quantity: '2',
          description: 'Test1',
          'tax-rate': 6,
          price: 33.87,
        },
        {
          quantity: '4',
          description: 'Test2',
          'tax-rate': 21,
          price: 10.45,
        },
      ],

      // We will use bottomNotice to add a message of choice to the bottom of our invoice
      bottomNotice: 'Kindly pay your invoice within 15 days.',

      // Here you can customize your invoice dimensions, currency, tax notation, and number formatting based on your locale
      settings: {
        currency: 'INR', // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        /*
       "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')
       "tax-notation": "gst", // Defaults to 'vat'
       // Using margin we can regulate how much white space we would like to have from the edges of our invoice
       "margin-top": 25, // Defaults to '25'
       "margin-right": 25, // Defaults to '25'
       "margin-left": 25, // Defaults to '25'
       "margin-bottom": 25, // Defaults to '25'
       "format": "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
       "height": "1000px", // allowed units: mm, cm, in, px
       "width": "500px", // allowed units: mm, cm, in, px
       "orientation": "landscape", // portrait or landscape, defaults to portrait
       */
      },

      /*
      Last but not least, the translate parameter.
      Used for translating the invoice to your preferred language.
      Defaults to English. Below example is translated to Dutch.
      We will not use translate in this sample to keep our samples readable.
   */
      translate: {
        /*
       "invoice": "FACTUUR",  // Default to 'INVOICE'
       "number": "Nummer", // Defaults to 'Number'
       "date": "Datum", // Default to 'Date'
       "due-date": "Verloopdatum", // Defaults to 'Due Date'
       "subtotal": "Subtotaal", // Defaults to 'Subtotal'
       "products": "Producten", // Defaults to 'Products'
       "quantity": "Aantal", // Default to 'Quantity'
       "price": "Prijs", // Defaults to 'Price'
       "product-total": "Totaal", // Defaults to 'Total'
       "total": "Totaal" // Defaults to 'Total'
       */
      },

      /*
      Customize enables you to provide your own templates.
      Please review the documentation for instructions and examples.
      Leave this option blank to use the default template
   */
      customize: {
        template: fs.readFileSync(htmlTemplate, 'base64'), // Must be base64 encoded html
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
