import {Entity, model, property} from '@loopback/repository';

@model()
export class WalletAudit extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;

  @property({
    type: 'number',
    //required: true,
  })
  transactionId: number;

  @property({
    type: 'number',
    //required: true,
  })
  transferId: number;

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
