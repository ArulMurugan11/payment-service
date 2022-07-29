import {TokenService} from '@loopback/authentication';
import {BindingKey, Interceptor} from '@loopback/core';
import {FluentSender} from 'fluent-logger';
import WinstonTransport from 'winston-transport';
import {LoggingComponent} from './component';
import {WinstonLogger} from './providers';

export namespace PaymentServiceBindings {
  export const DATASOURCE_NAME = 'mysqlconnector';
}

export namespace UserService {
  //export const DATASOURCE = 'userService';
  export const baseURL = process.env.USER_SERVICE_URL;
  export const apiURL = `${baseURL}api/`;
  export const AUTH_URL = `${apiURL}user/me`;
  export const USER = `${apiURL}users`;
}

export const API_PREFIX = '/api';

export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = process.env.JWT_TOKEN_SECRET ?? 'jwtToken';
  export const TOKEN_EXPIRES_IN_VALUE = '21600';
}
export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace LoggingBindings {
  export const COMPONENT = BindingKey.create<LoggingComponent>(
    'components.LoggingComponent',
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const FLUENT_SENDER = BindingKey.create<FluentSender<any>>(
    'logging.fluent.sender',
  );

  /**
   * Binding key for winston logger
   */
  export const WINSTON_LOGGER = BindingKey.create<WinstonLogger>(
    'logging.winston.logger',
  );

  /**
   * Binding key for winston transport backed by fluent
   */
  export const WINSTON_TRANSPORT_FLUENT = BindingKey.create<WinstonTransport>(
    'logging.winston.transports.fluent',
  );

  /**
   * Binding key for method invocation logger with winston
   */
  export const WINSTON_INVOCATION_LOGGER = BindingKey.create<Interceptor>(
    'logging.winston.invocationLogger',
  );

  /**
   * Binding key for http access logger with winston
   */
  export const WINSTON_HTTP_ACCESS_LOGGER = BindingKey.create<Interceptor>(
    'logging.winston.httpAccessLogger',
  );
}

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
