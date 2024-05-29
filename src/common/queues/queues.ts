import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  SendMessageCommandOutput,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { fraudTracer } from "@govuk-one-login/logging/logging";
import { LogEvents } from "../enums/log-events";
import { ErrorMessages } from "../enums/errors";

const sqsClient = fraudTracer.captureAWSv3Client(
  new SQSClient({
    region: process.env.AWS_REGION,
  }),
);

export const sqsBatchMessageMaxCount: number = 10;

/**
 * Send Message to SQS Queue
 *
 * @param message
 * @param queueUrl
 */
export const sendSqsMessage = async (
  message: string,
  queueUrl: string,
): Promise<SendMessageCommandOutput> => {
  return await sqsClient.send(
    new SendMessageCommand({
      MessageBody: message,
      QueueUrl: queueUrl,
    }),
  );
};

/**
 * Sends a Batch Message to SQS Queue
 *
 * @param messages is the array of up to 10 messages
 * @param queueUrl is the URL of the SQS queue
 */
export const sendBatchSqsMessage = async (
  messages: string[],
  queueUrl: string | undefined,
): Promise<SendMessageBatchCommandOutput> => {
  //Ensure a valid number of messages
  if (messages.length < 1) {
    throw new Error(ErrorMessages.NoMessages);
  }
  if (messages.length > sqsBatchMessageMaxCount) {
    throw new Error(ErrorMessages.TooManyMessages);
  }

  // Format messages correctly, assign each an ID within the batch - NOT the message ID that is generated when each is sent
  const entries: SendMessageBatchRequestEntry[] = messages.map(
    (message, index) => ({
      Id: `Batch_Entry_${index}`,
      MessageBody: message,
    }),
  );

  // Make the send request and return the result
  return await sqsClient.send(
    new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: entries,
    }),
  );
};

export class LogSuccessful {
  static stringTypeGuard(string: string | undefined): string is string {
    return !!string;
  }

  static async getSuccessDegree(
    messageResponses: SendMessageBatchCommandOutput,
  ): Promise<[LogEvents, string[], string[]]> {
    // get Ids into seperate arrays
    const successfulMessageIds: string[] =
      messageResponses.Successful?.map((response) => response.MessageId).filter(
        this.stringTypeGuard,
      ) ?? [];

    const failedBatchIds: string[] =
      messageResponses.Failed?.map((response) => response.Id).filter(
        this.stringTypeGuard,
      ) ?? [];

    // default to all successful
    let logEvent: LogEvents = LogEvents.FullSQSBatchGenerated;

    // check for failed messages
    if (messageResponses.Successful && messageResponses.Failed) {
      // partial success
      logEvent = LogEvents.PartialSQSBatchGenerated;
    } else if (!messageResponses.Successful && messageResponses.Failed) {
      // complete failure
      logEvent = LogEvents.FailedSQSBatchGenerated;
    }
    return [logEvent, successfulMessageIds, failedBatchIds];
  }
}
