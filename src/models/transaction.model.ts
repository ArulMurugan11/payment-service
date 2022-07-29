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
  transaction_id?: number;

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
  })
  raw_response?: string;

  @property({
    type: 'number',
    required: true,
  })
  ticket_id: number;

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
    type: 'number',
    required: true,
  })
  bucketListId: number;

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
