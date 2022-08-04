import {Entity, model, property} from '@loopback/repository';
enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  HOLD = 'hold',
}
@model()
export class Transaction extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  transactionId: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(TransactionStatus),
    },
  })
  status: string;

  @property({
    type: 'string',
    required: true,
  })
  currencyType: string;

  @property({
    type: 'string',
    required: true,
  })
  amount: string;

  @property({
    type: 'string',
  })
  rawResponse?: string;

  @property({
    type: 'number',
    required: true,
  })
  ticketId: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;

  @property({
    type: 'number',
    required: true,
  })
  orderId: number;
  
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

  constructor(data?: Partial<Transaction>) {
    super(data);
  }
}

export interface TransactionRelations {
  // describe navigational properties here
}

export type TransactionWithRelations = Transaction & TransactionRelations;
