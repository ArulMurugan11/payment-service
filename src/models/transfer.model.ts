import {Entity, model, property} from '@loopback/repository';
enum TransferStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  HOLD = 'hold',
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
    required: true,
  })
  amount: string;

  @property({
    type: 'string',
    required: true,
  })
  medium: string;

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
