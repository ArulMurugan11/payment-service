import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlconnectorDataSource} from '../datasources';
import {WalletAudit, WalletAuditRelations} from '../models';

export class WalletAuditRepository extends DefaultCrudRepository<
  WalletAudit,
  typeof WalletAudit.prototype.id,
  WalletAuditRelations
> {
  constructor(
    @inject('datasources.mysqlconnector') dataSource: MysqlconnectorDataSource,
  ) {
    super(WalletAudit, dataSource);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}
