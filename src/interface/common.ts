/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FilterInterface {
  [key: string]: any;
  filters: {
    [key: string]: {
      [key: string]: any;
    };
  };
}

export interface KeyValue {
  [key: string]: any;
}
export interface DefaultFilterProperties {
  sort: string;
  offset: Number;
  limit: Number;
  skip: Number;
  order: string;
}
