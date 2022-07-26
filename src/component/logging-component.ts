// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @loopback/logging
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Binding,
  Component,
  config,
  ContextTags,
  extensionFor,
  injectable,
  ProviderMap,
} from '@loopback/core';
import {
  HttpAccessLogInterceptor,
  InvocationLoggingInterceptor,
} from '../interceptor';
import {LoggingBindings} from '../key';
import {WinstonLoggerProvider, WINSTON_TRANSPORT} from '../providers';
import {
  FluentSenderProvider,
  FluentTransportProvider,
} from '../providers/fluent';

/**
 * Configuration for LoggingComponent
 */
export type LoggingComponentConfig = {
  /**
   * A flag to enable fluent, default to `true`
   */
  enableFluent?: boolean;
  /**
   * A flag to enable Winston-based http access log, default to `true`
   */
  enableHttpAccessLog?: boolean;
};

/**
 * A component providing logging facilities
 */
@injectable({tags: {[ContextTags.KEY]: LoggingBindings.COMPONENT}})
export class LoggingComponent implements Component {
  providers: ProviderMap;
  bindings: Binding<unknown>[];

  constructor(
    @config()
    loggingConfig: LoggingComponentConfig | undefined,
  ) {
    loggingConfig = {
      ...loggingConfig,
      enableFluent: false,
      enableHttpAccessLog: true,
    };
    this.providers = {
      [LoggingBindings.WINSTON_LOGGER.key]: WinstonLoggerProvider,
      [LoggingBindings.WINSTON_INVOCATION_LOGGER.key]:
        InvocationLoggingInterceptor,
    };

    if (loggingConfig.enableHttpAccessLog) {
      this.providers[LoggingBindings.WINSTON_HTTP_ACCESS_LOGGER.key] =
        HttpAccessLogInterceptor;
    }

    if (loggingConfig.enableFluent) {
      this.providers[LoggingBindings.FLUENT_SENDER.key] = FluentSenderProvider;
      // Only create fluent transport if it's configured
      this.bindings = [
        Binding.bind(LoggingBindings.WINSTON_TRANSPORT_FLUENT)
          .toProvider(FluentTransportProvider)
          .apply(extensionFor(WINSTON_TRANSPORT)),
      ];
    }
    // console.log(' Logging component registered ..................');
  }
}
