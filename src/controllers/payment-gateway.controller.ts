import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {WinstonLogger} from '@loopback/logging';
import {
  HttpErrors,
  post,
  Request,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {logInvocation} from '../decorator';
import {API_PREFIX, LoggingBindings, PaymentGateWay} from '../key';
const Razorpay = require('razorpay');
const razorPay = new Razorpay({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  key_id: PaymentGateWay.KeyId,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  key_secret: PaymentGateWay.secret,
});
@authenticate('jwt')
export class PaymentGatewayController {
  constructor(
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
  ) {}

  @logInvocation()
  @post(`${API_PREFIX}/razorpay/customer`)
  @response(200, {
    description: 'Payment gateway - user Id',
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
  async createUserInRazorPay(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email', 'phone'],
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              phone: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    userData: {
      name: string;
      email: string;
      phone: string;
    },
  ) {
    const customer = await razorPay.customers.create({
      name: userData.name,
      contact: userData.phone,
      email: userData.email,
    });
    return customer.id;
  }

  @logInvocation()
  @post(`${API_PREFIX}/razorpay`)
  @response(200, {
    description: 'Wallet model count',
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
    const customer = this.res?.locals?.user;

    try {
      await razorPay.customers.create({
        name: customer.name,
        // contact: customer.phone,
        email: customer.email,
      });
    } catch (error) {
      if (
        error?.error?.description !== 'Customer already exists for the merchant'
      ) {
        console.log('Errror while adding currency to the account', error);
        throw new HttpErrors.InternalServerError();
      }
    }
    const order = await razorPay.orders.create({
      amount: topupData.amount,
      currency: topupData.currency,
      notes: {
        userId: customer.userId,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.countryCode,
      },
    });

    return {
      id: order.id,
    };
  }
}
