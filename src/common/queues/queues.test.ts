import { expect, describe, it } from "@jest/globals";
import { sendSqsMessage } from "./queues";
import { mockClient } from "aws-sdk-client-mock";
import { SQSClient } from "@aws-sdk/client-sqs";

const sqsMock = mockClient(SQSClient);
sqsMock.onAnyCommand().resolves({ MessageId: "12345" });

describe("sendSqsMessage", () => {
  it("should be defined", async () => {
    expect(sendSqsMessage).toBeDefined();
  });

  it("should call SQS send", async () => {
    jest.spyOn(sqsMock, "send");
    const response = await sendSqsMessage("Message", "test-url");
    expect(response).toEqual({ MessageId: "12345" });
  });
});
