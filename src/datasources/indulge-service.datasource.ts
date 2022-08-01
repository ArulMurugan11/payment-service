import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {IndulgeService} from '../key';

const baseUrl = `${IndulgeService.apiURL}`;
const config = {
  name: IndulgeService.DATASOURCE,
  connector: 'rest',
  baseURL: `${baseUrl}`,
  crud: true,
  options: {
    headers: {
      'content-type': 'application/json',
      Authorization: `{token}`,
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: `${IndulgeService.ORDER_URL}?{filter}`,
        headers: {
          'content-type': 'application/json',
          Authorization: `{token}`,
        },
      },
      functions: {
        getOrders: ['token', 'filter'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class IndulgeServiceDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = `${IndulgeService.DATASOURCE}`;
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.userService', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
