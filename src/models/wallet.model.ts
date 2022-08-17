import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    hiddenProperties: [],
    mysql: {table: 'wallet'},
  },
})
export class Wallet extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    mysql: {
      columnName: 'wallet_id',
    },
  })
  walletId?: number;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'balance',
    },
  })
  balance: string;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'user_id',
    },
  })
  userId: number;

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

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Wallet>) {
    super(data);
  }
}

export interface WalletRelations {
  // describe navigational properties here
}

export type WalletWithRelations = Wallet & WalletRelations;
