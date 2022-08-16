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
  Transfer,
} from '../models';
import {WalletAuditRepository} from '../repositories';

export class WalletAuditTransferController {
  constructor(
    @repository(WalletAuditRepository)
    public walletAuditRepository: WalletAuditRepository,
  ) { }

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
    return this.walletAuditRepository.transfer(id);
  }
}
