import { expect, describe, it } from "@jest/globals";
import { receiverLambda } from "./handler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { ErrorMessages } from "../../common/enums/errors";

const mockAccessToken = "eyJ9.eyJjbGllbnRfaWQiOiAiZGZodXNpZmh1aWZnaCJ9.eyJ9";

jest.mock("@govuk-one-login/logging/logging", () => ({
  FraudLogger: jest.fn(() => ({
    logStartedProcessing: jest.fn(),
    logSuccessfullyProcessed: jest.fn(),
    logErrorProcessing: jest.fn(),
    metrics: {
      publishStoredMetrics: jest.fn(),
    },
  })),
  fraudTracer: {
    captureLambdaHandler: () => jest.fn(),
    captureMethod: () => jest.fn(),
  },
}));

jest.mock("../../common/queues/queues", () => ({
  sendSqsMessage: jest.fn(() => ({ MessageId: "TestId" })),
}));

jest.mock("../../common/validation/request-validation", () => ({
  RequestValidation: {
    validateInboundEvent: jest.fn(),
  },
}));

describe("Receiver Handler", () => {
  it("should be defined", async () => {
    expect(receiverLambda.handler).toBeDefined();
  });

  it("should return error if no body in Request", async () => {
    const response = await receiverLambda.handler(
      {} as APIGatewayProxyEvent,
      {} as Context,
    );

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify(ErrorMessages.NoBody),
      headers: {
        "Cache-Control": "private",
        "Content-Security-Policy": "default-src 'self'",
        "Strict-Transport-Security": "max-age=31536000",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "deny",
      },
    });
    expect(receiverLambda.fraudLogger.logErrorProcessing).toHaveBeenCalledWith(
      "No Message ID",
      ReferenceError(ErrorMessages.NoBody),
    );
  });

  it("should return error if Queue Url is not defined", async () => {
    const response = await receiverLambda.handler(
      { body: {} } as APIGatewayProxyEvent,
      {} as Context,
    );

    expect(response).toEqual({
      statusCode: 500,
      body: JSON.stringify(ErrorMessages.NoQueueUrl),
      headers: {
        "Cache-Control": "private",
        "Content-Security-Policy": "default-src 'self'",
        "Strict-Transport-Security": "max-age=31536000",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "deny",
      },
    });
    expect(receiverLambda.fraudLogger.logErrorProcessing).toHaveBeenCalledWith(
      "No Message ID",
      ReferenceError(ErrorMessages.NoQueueUrl),
    );
  });

  it("should return ok to a healthcheck request", async () => {
    process.env.VALIDATOR_QUEUE_URL = "Queue Url";
    const response = await receiverLambda.handler(
      { body: "healthcheck" } as APIGatewayProxyEvent,
      {} as Context,
    );

    expect(response).toEqual({
      statusCode: 200,
      body: "ok",
    });
    expect(
      receiverLambda.fraudLogger.logStartedProcessing,
    ).not.toHaveBeenCalled();
    expect(
      receiverLambda.fraudLogger.logSuccessfullyProcessed,
    ).not.toHaveBeenCalled();
  });

  it("should return Message Id if successful", async () => {
    process.env.VALIDATOR_QUEUE_URL = "Queue Url";
    const response = await receiverLambda.handler(
      {
        body: {},
        headers: { Authorization: mockAccessToken },
      } as unknown as APIGatewayProxyEvent,
      {} as Context,
    );

    expect(response).toEqual({
      statusCode: 202,
      body: JSON.stringify("TestId"),
      headers: {
        "Cache-Control": "private",
        "Content-Security-Policy": "default-src 'self'",
        "Strict-Transport-Security": "max-age=31536000",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "deny",
      },
    });
    expect(receiverLambda.fraudLogger.logStartedProcessing).toHaveBeenCalled();
    expect(
      receiverLambda.fraudLogger.logSuccessfullyProcessed,
    ).toHaveBeenCalledWith(undefined, "TestId");
  });
});
