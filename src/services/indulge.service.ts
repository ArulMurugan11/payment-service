/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {IndulgeServiceDataSource} from '../datasources';
import {IndulgeService} from '../key';
export interface IndulgeRestService {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  // getDetails(apiKey: string, title: string): Promise<any>;
  getOrders(token: string, filter: string): Promise<any>;
}

export class IndulgeServiceProvider implements Provider<IndulgeRestService> {
  constructor(
    // csmService must match the name property in the datasource json file
    @inject(`datasources.${IndulgeService.DATASOURCE}`)
    protected dataSource: IndulgeServiceDataSource = new IndulgeServiceDataSource(),
  ) {}

  value(): Promise<IndulgeRestService> {
    return getService(this.dataSource);
  }
}
