import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlconnectorDataSource} from '../datasources';
import {Wallet, WalletRelations} from '../models';

export class WalletRepository extends DefaultCrudRepository<
  Wallet,
  typeof Wallet.prototype.walletId,
  WalletRelations
> {
  constructor(
    @inject('datasources.mysqlconnector') dataSource: MysqlconnectorDataSource,
  ) {
    super(Wallet, dataSource);
  }
}
