import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Transaction} from './transaction.model';
import {Transfer} from './transfer.model';

@model()
export class WalletAudit extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;
  @property({
    type: 'string',
    required: true,
  })
  balance: string;

  @property({
    type: 'date',
    required: true,
  })
  createdAt: string;

  @property({
    type: 'date',
    required: true,
  })
  updatedAt: string;

  transaction: Transaction;
  transfer: Transfer;

  @belongsTo(() => Transaction)
  transactionId: number;

  @belongsTo(() => Transfer)
  transferId: number;
  // @belongsTo(() => User)
  // userId: number;

  constructor(data?: Partial<WalletAudit>) {
    super(data);
  }
}

export interface WalletAuditRelations {
  // describe navigational properties here
}

export type WalletAuditWithRelations = WalletAudit & WalletAuditRelations;
