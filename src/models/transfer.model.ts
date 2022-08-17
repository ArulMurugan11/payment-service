import {Entity, model, property} from '@loopback/repository';
export enum TransferStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUND = 'refunded',
}

@model()
export class Transfer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  transferId?: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;

  @property({
    type: 'string',
  })
  rawResponse: string;

  @property({
    type: 'string',
    required: true,
  })
  amount: string;

  @property({
    type: 'string',
    required: true,
  })
  currency: string;

  @property({
    type: 'string',
  })
  mode: string;

  @property({
    type: 'string',
  })
  receipt: string;

  @property({
    type: 'string',
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  paymentId: string;

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

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(TransferStatus),
    },
  })
  status: string;

  @property({
    type: 'string',
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
