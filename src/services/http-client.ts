/* eslint-disable @typescript-eslint/no-explicit-any */
import got from 'axios';

export const get = async function (
  baseUrl: string,
  params: any,
  headers: any,
): Promise<any> {
  const url = baseUrl;
  return got.get(url, {
    headers,
    params,
  });
};
