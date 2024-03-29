import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {PaymentServiceBindings} from '../key';

const config = {
  name: PaymentServiceBindings.DATASOURCE_NAME,
  connector: process.env.DB_CONNECTOR,
  url: '',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PSWD,
  database: process.env.DB_NAME,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MysqlconnectorDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = PaymentServiceBindings.DATASOURCE_NAME;
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.${PaymentServiceBindings.DATASOURCE_NAME}', {
      optional: true,
    })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
