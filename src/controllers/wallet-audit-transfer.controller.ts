import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, HttpErrors, param} from '@loopback/rest';
import {Transfer, WalletAudit} from '../models';
import {WalletAuditRepository} from '../repositories';

export class WalletAuditTransferController {
  constructor(
    @repository(WalletAuditRepository)
    public walletAuditRepository: WalletAuditRepository,
  ) {}

  @get('/wallet-audits/{id}/transfer', {
    responses: {
      '200': {
        description: 'Transfer belonging to WalletAudit',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Transfer)},
          },
        },
      },
    },
  })
  async getTransfer(
    @param.path.number('id') id: typeof WalletAudit.prototype.id,
  ): Promise<Transfer> {
    const transfer = await this.walletAuditRepository.transfer(id);
    if (!transfer) {
      throw new HttpErrors.NotFound('Transfer Not Exist');
    }
    transfer.amount = String(Number(transfer.amount) / 100);
    return transfer;
  }
}
