import {Entity, model, property} from '@loopback/repository';
export enum TransferStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUND = 'refunded',
}

@model({
  settings: {
    hiddenProperties: [],
    mysql: {table: 'transfer'},
  },
})
export class Transfer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    mysql: {
      columnName: 'transfer_id',
    },
  })
  transferId?: number;

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
    mysql: {
      columnName: 'raw_response',
    },
  })
  rawResponse: string;

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
    required: true,
    mysql: {
      columnName: 'currency',
    },
  })
  currency: string;

  @property({
    type: 'string',
    mysql: {
      columnName: 'mode',
    },
  })
  mode: string;

  @property({
    type: 'string',
    mysql: {
      columnName: 'receipt',
    },
  })
  receipt: string;

  @property({
    type: 'string',
    mysql: {
      columnName: 'title',
    },
  })
  title: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      columnName: 'payment_id',
    },
  })
  paymentId: string;

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

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(TransferStatus),
    },
    mysql: {
      columnName: 'status',
    },
  })
  status: string;

  @property({
    type: 'string',
    mysql: {
      columnName: 'raw',
    },
  })
  raw?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Transfer>) {
    super(data);
  }
}

export interface TransferRelations {
  // describe navigational properties here
}

export type TransferWithRelations = Transfer & TransferRelations;
