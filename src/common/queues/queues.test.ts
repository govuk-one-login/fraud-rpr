import { expect, describe, it } from "@jest/globals";
import {
  sendSqsMessage,
  sendBatchSqsMessage,
  sqsBatchMessageMaxCount,
  LogSuccessful,
} from "./queues";
import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageBatchCommandOutput } from "@aws-sdk/client-sqs";
import { ErrorMessages } from "../enums/errors";
import { LogEvents } from "../enums/log-events";

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

describe("sendBatchSqsMessage", () => {
  it("should be defined", async () => {
    expect(sendBatchSqsMessage).toBeDefined();
  });

  it("should call SQS send for batch of messages", async () => {
    jest.spyOn(sqsMock, "send");
    const messages: string[] = ["1", "2", "3", "4", "5", "6", "7"];
    const response = await sendBatchSqsMessage(messages, "test-url");
    expect(response).toEqual({ MessageId: "12345" });
  });

  it("should throw an error when no messages provided", async () => {
    const messages: string[] = [];
    await expect(sendBatchSqsMessage(messages, "test-url")).rejects.toThrow(
      ErrorMessages.NoMessages,
    );
  });

  it("should throw an error when messages exceeds SqsBatchMessageMaxCount", async () => {
    const messages: string[] = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
    ];

    await expect(sendBatchSqsMessage(messages, "test-url")).rejects.toThrow(
      ErrorMessages.TooManyMessages,
    );
  });
});
describe("LogSuccessful", () => {
  describe("stringTypeGuard", () => {
    it("should return true for a non-empty string", () => {
      expect(LogSuccessful.stringTypeGuard("test")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(LogSuccessful.stringTypeGuard(undefined)).toBe(false);
    });

    it("should return false for an empty string", () => {
      expect(LogSuccessful.stringTypeGuard("")).toBe(false);
    });
  });

  describe("getSuccessDegree", () => {
    it("should return FullSETBatchGenerated when all messages are successful", async () => {
      const messageResponses = {
        Successful: [{ MessageId: "1" }, { MessageId: "2" }],
        Failed: undefined,
      };

      const result = await LogSuccessful.getSuccessDegree(
        messageResponses as SendMessageBatchCommandOutput,
      );

      expect(result[0]).toBe(LogEvents.FullSQSBatchGenerated);
      expect(result[1]).toEqual(["1", "2"]);
      expect(result[2]).toEqual([]);
    });

    it("should return PartialSETBatchGenerated when some messages are successful and some are failed", async () => {
      const messageResponses = {
        Successful: [{ MessageId: "1" }],
        Failed: [{ Id: "3", Message: "Failed" }],
      };

      const result = await LogSuccessful.getSuccessDegree(
        messageResponses as SendMessageBatchCommandOutput,
      );

      expect(result[0]).toBe(LogEvents.PartialSQSBatchGenerated);
      expect(result[1]).toEqual(["1"]);
      expect(result[2]).toEqual(["3"]);
    });

    it("should return FailedSETBatchGenerated when all messages are failed", async () => {
      const messageResponses = {
        Successful: undefined,
        Failed: [
          { Id: "3", Message: "Failed" },
          { Id: "4", Message: "Failed" },
        ],
      };

      const result = await LogSuccessful.getSuccessDegree(
        messageResponses as SendMessageBatchCommandOutput,
      );

      expect(result[0]).toBe(LogEvents.FailedSQSBatchGenerated);
      expect(result[1]).toEqual([]);
      expect(result[2]).toEqual(["3", "4"]);
    });
  });
});
