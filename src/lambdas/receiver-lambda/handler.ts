import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Context,
} from "aws-lambda";
import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";
import { ErrorMessages } from "../../common/enums/errors";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { RequestValidation } from "../../common/validation/request-validation";
import { BadRequestError } from "../../common/errors/errors";
import middy from "@middy/core";

class ReceiverLambda implements LambdaInterface {
  constructor(public fraudLogger: FraudLogger) {}

  /**
   *  Triggered from Inbound Event API Gateway. Sends valid events to Validator Queue
   *
   * @param event
   * @param context
   */
  public async handler(
    event: APIGatewayProxyEvent,
    _context: Context,
  ): Promise<APIGatewayProxyResult> {
    let statusCode: number = 202;
    let body: any;

    try {
      if (!event.body) throw new BadRequestError(ErrorMessages.NoBody);

      // health check handling
    } catch (error: any) {
      body = error.message;
      this.fraudLogger.logErrorProcessing("No Message ID", error);
      statusCode = error instanceof BadRequestError ? 400 : 500;
    } finally {
      this.fraudLogger.metrics.publishStoredMetrics();
    }

    return {
      statusCode,
      body: JSON.stringify(body),
      headers: {
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "deny",
        "Strict-Transport-Security": "max-age=31536000",
        "Cache-Control": "private",
        "X-Content-Type-Options": "nosniff",
      },
    };
  }

  /**
   * Get ClientID from Access token in request
   * @param event
   * @returns
   */
}

export const receiverLambda: ReceiverLambda = new ReceiverLambda(
  new FraudLogger(
    new Logger(),
    new Metrics({
      serviceName: process.env.LAMBDA_NAME,
      namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
    }),
  ),
);
