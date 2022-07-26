import {HttpErrors, MiddlewareSequence, RequestContext} from '@loopback/rest';
import {UserService} from './key';
//import {UserService} from './key';
import {get} from './services/http-client';
export class MySequence extends MiddlewareSequence {
  async handle(context: RequestContext) {
    const {request, response} = context;

    if (request.originalUrl.indexOf('/api/') > -1) {
      if (!request.headers.authorization) {
        const error = new HttpErrors.Unauthorized(
          `Authorization header not found.`,
        );
        response.status(403).send(error.message);
      }

      try {
        const {data} = await get(
          UserService.AUTH_URL,
          {},
          {
            ...request.headers,
          },
        );
        response.locals.user = data;
      } catch (err) {
        console.log(err?.response?.status, err?.data, err);
        const errorCode = err?.response?.data?.error?.statusCode || 500;
        const errorMessage =
          err?.response?.data?.error?.message || 'Internal Server error';
        response.status(errorCode).send(errorMessage);
      }
    }
    await super.handle(context);
  }
}
