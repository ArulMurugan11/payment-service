import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Transaction} from './transaction.model';
import {Transfer} from './transfer.model';

@model({
  settings: {
    hiddenProperties: [],
    mysql: {table: 'wallet_audit'},
  },
})
export class WalletAudit extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    mysql: {
      columnName: 'id',
    },
  })
  id: number;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'user_id',
    },
  })
  userId: number;
  @property({
    type: 'string',
    required: true,
    mysql: {
      columnName: 'balance',
    },
  })
  balance: string;

  @property({
    type: 'date',
    required: true,
    mysql: {
      columnName: 'created_at',
    },
  })
  createdAt: string;

  @property({
    type: 'date',
    required: true,
    mysql: {
      columnName: 'updated_at',
    },
  })
  updatedAt: string;

  transaction: Transaction;
  transfer: Transfer;

  @belongsTo(
    () => Transaction,
    {keyFrom: 'transactionId'},
    {name: 'transaction_id'},
  )
  transactionId: number;

  @belongsTo(() => Transfer, {keyFrom: 'transferId'}, {name: 'transfer_id'})
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
