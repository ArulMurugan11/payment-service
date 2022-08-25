import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, HttpErrors, param} from '@loopback/rest';
import {Transaction, WalletAudit} from '../models';
import {WalletAuditRepository} from '../repositories';

export class WalletAuditTransactionController {
  constructor(
    @repository(WalletAuditRepository)
    public walletAuditRepository: WalletAuditRepository,
  ) {}

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
    const transactions = await this.walletAuditRepository.transaction(id);
    if (!transactions) {
      throw new HttpErrors.NotFound('Transaction Not Exist');
    }
    transactions.amount = String(Number(transactions.amount) / 100);
    return transactions;
  }
}
