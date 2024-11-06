import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import { fraudTracer } from "@govuk-one-login/logging/logging";

const sqsClient = fraudTracer.captureAWSv3Client(
  new SQSClient({
    region: process.env.AWS_REGION,
  }),
);

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
