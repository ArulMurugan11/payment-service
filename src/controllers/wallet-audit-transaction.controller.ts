import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  WalletAudit,
  Transaction,
} from '../models';
import {WalletAuditRepository} from '../repositories';

export class WalletAuditTransactionController {
  constructor(
    @repository(WalletAuditRepository)
    public walletAuditRepository: WalletAuditRepository,
  ) { }

  @get('/wallet-audits/{id}/transaction', {
    responses: {
      '200': {
        description: 'Transaction belonging to WalletAudit',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Transaction)},
          },
        },
      },
    },
  })
  async getTransaction(
    @param.path.number('id') id: typeof WalletAudit.prototype.id,
  ): Promise<Transaction> {
    return this.walletAuditRepository.transaction(id);
  }
}
