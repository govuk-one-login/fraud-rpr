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
    getRootXrayTraceId: jest.fn().mockImplementation(() => "test-trace-id"),
  },
}));

jest.mock("../../common/validation/request-validation", () => ({
  RequestValidation: {
    validateInboundEvent: jest.fn(),
  },
}));

jest.mock("crypto", () => {
  return {
    ...jest.requireActual("crypto"),
    randomUUID: jest.fn().mockImplementation(() => "123-456-789-101112-131415"),
  };
});

describe("Receiver Handler", () => {
  it("should be defined", async () => {
    expect(receiverLambda.handler).toBeDefined();
  });
});
