import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlconnectorDataSource} from '../datasources';
import {Transaction, TransactionRelations} from '../models';

export class TransactionRepository extends DefaultCrudRepository<
  Transaction,
  typeof Transaction.prototype.transaction_id,
  TransactionRelations
> {
  constructor(
    @inject('datasources.mysqlconnector') dataSource: MysqlconnectorDataSource,
  ) {
    super(Transaction, dataSource);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}
