import {Entity, model, property} from '@loopback/repository';
enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  HOLD = 'hold',
}
@model({
  settings: {
    hiddenProperties: [],
    mysql: {table: 'transaction'},
  },
})
export class Transaction extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    mysql: {
      columnName: 'transaction_id',
    },
  })
  transactionId: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(TransactionStatus),
    },
    mysql: {
      columnName: 'status',
    },
  })
  status: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      columnName: 'currency_type',
    },
  })
  currencyType: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      columnName: 'amount',
    },
  })
  amount: string;

  @property({
    type: 'string',
    mysql: {
      columnName: 'raw_response',
    },
  })
  rawResponse?: string;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'ticket_id',
    },
  })
  ticketId: number;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'user_id',
    },
  })
  userId: number;

  @property({
    type: 'number',
    required: true,
    mysql: {
      columnName: 'order_id',
    },
  })
  orderId: number;

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

  constructor(data?: Partial<Transaction>) {
    super(data);
  }
}

export interface TransactionRelations {
  // describe navigational properties here
}

export type TransactionWithRelations = Transaction & TransactionRelations;
