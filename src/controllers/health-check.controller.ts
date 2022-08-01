import {inject} from '@loopback/core';
import {WinstonLogger} from '@loopback/logging';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import {logInvocation} from '../decorator';
import {LoggingBindings} from '../key';

/**
 * OpenAPI response for health()
 */
const HEALTH_RESPONSE: ResponseObject = {
  description: 'HEALTH Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'HealthResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class HealthController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(LoggingBindings.WINSTON_LOGGER)
    private logger: WinstonLogger,
  ) {}

  // Map to `GET /health`
  @logInvocation()
  @get('/health')
  @response(200, HEALTH_RESPONSE)
  health(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: "Hello, I'm Alive",
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }
}
