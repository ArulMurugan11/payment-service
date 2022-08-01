// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @loopback/logging
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  asGlobalInterceptor,
  BindingScope,
  config,
  ContextTags,
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {Request, RequestContext, Response, RestBindings} from '@loopback/rest';
import morgan from 'morgan';
import {Logger} from 'winston';
import {LoggingBindings} from '../key';

export interface AccessLogOptions extends morgan.Options<Request, Response> {
  format?: string | morgan.FormatFn;
}
/**
 * A global interceptor that provides logging for http requests/responses.
 */
@injectable(asGlobalInterceptor('logging'), {
  tags: {
    [ContextTags.KEY]: LoggingBindings.WINSTON_HTTP_ACCESS_LOGGER,
    // Only apply to invocations from REST routes
    [ContextTags.GLOBAL_INTERCEPTOR_SOURCE]: 'route',
  },
  scope: BindingScope.SINGLETON,
})
export class HttpAccessLogInterceptor implements Provider<Interceptor> {
  constructor(
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: Logger,
    @config()
    private morganOptions: AccessLogOptions = {format: 'combined'},
  ) {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept<T>(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<T>,
  ) {
    const reqCtx = await invocationCtx.get<RequestContext>(
      RestBindings.Http.CONTEXT,
    );
    const options: AccessLogOptions = {
      ...this.morganOptions,
      stream: {
        write: (message: string) => {
          this.logger.info(message);
        },
      },
    };
    if (typeof options.format === 'function') {
      morgan(options.format, options)(
        reqCtx.request,
        reqCtx.response,
        () => {},
      );
    } else {
      morgan(options.format ?? 'combined', options)(
        reqCtx.request,
        reqCtx.response,
        () => {},
      );
    }
    return next();
  }
}
