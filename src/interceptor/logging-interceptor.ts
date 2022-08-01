// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @loopback/logging
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
import {
  BindingScope,
  ContextTags,
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {RequestContext, RestBindings} from '@loopback/rest';
import {v4 as uuidv4} from 'uuid';
import {Logger} from 'winston';
import {LoggingBindings} from '../key';

/**
 * A local interceptor that provides logging for method invocations.
 */
@injectable({
  tags: {[ContextTags.KEY]: LoggingBindings.WINSTON_INVOCATION_LOGGER},
  scope: BindingScope.SINGLETON,
})
export class InvocationLoggingInterceptor implements Provider<Interceptor> {
  constructor(
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: Logger,
  ) {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept<T>(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<T>,
  ) {
    const {request, response} = await invocationCtx.get<RequestContext>(
      RestBindings.Http.CONTEXT,
    );
    const reqCorrelationId = uuidv4();

    response.locals.reqCorrelationId = reqCorrelationId;
    const {
      query,
      params,
      headers: {userId},
    } = request;
    const logObj = {
      reqId: reqCorrelationId,
      userId,
      params,
      query,
      pa: request.path,
    };
    try {
      console.log(
        'invoking %s with:',
        invocationCtx.targetName,
        invocationCtx.args,
        JSON.stringify(logObj),
      );

      const result = await next();

      // console.log(invocationCtx.targetName, result),
      //this.logger.log(
      console.log(
        'verbose',
        'returned from %s:',
        invocationCtx.targetName,
        JSON.stringify(logObj),
        //result,
      );
      return result;
    } catch (err) {
      console.log(
        'error:: ',
        invocationCtx.targetName,
        JSON.stringify({...logObj, err}),
      );
      throw err;
    }
  }
}
