import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqlconnectorDataSource} from '../datasources';
import {WalletAudit, WalletAuditRelations, Transaction, Transfer} from '../models';
import {TransactionRepository} from './transaction.repository';
import {TransferRepository} from './transfer.repository';

export class WalletAuditRepository extends DefaultCrudRepository<
  WalletAudit,
  typeof WalletAudit.prototype.id,
  WalletAuditRelations
> {

  public readonly transaction: BelongsToAccessor<Transaction, typeof WalletAudit.prototype.id>;

  public readonly transfer: BelongsToAccessor<Transfer, typeof WalletAudit.prototype.id>;

  constructor(
    @inject('datasources.mysqlconnector') dataSource: MysqlconnectorDataSource, @repository.getter('TransactionRepository') protected transactionRepositoryGetter: Getter<TransactionRepository>, @repository.getter('TransferRepository') protected transferRepositoryGetter: Getter<TransferRepository>,
  ) {
    super(WalletAudit, dataSource);
    this.transfer = this.createBelongsToAccessorFor('transfer', transferRepositoryGetter,);
    this.registerInclusionResolver('transfer', this.transfer.inclusionResolver);
    this.transaction = this.createBelongsToAccessorFor('transaction', transactionRepositoryGetter,);
    this.registerInclusionResolver('transaction', this.transaction.inclusionResolver);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}
