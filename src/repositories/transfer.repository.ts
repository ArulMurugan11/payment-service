import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlconnectorDataSource} from '../datasources';
import {Transfer, TransferRelations} from '../models';

export class TransferRepository extends DefaultCrudRepository<
  Transfer,
  typeof Transfer.prototype.transferId,
  TransferRelations
> {
  constructor(
    @inject('datasources.mysqlconnector') dataSource: MysqlconnectorDataSource,
  ) {
    super(Transfer, dataSource);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}
