export enum ErrorMessages {
  FailedToSendAll = "Failed to send all messages in batch",
  InvalidSQSResponse = "Invalid response received from SQS client",
  LostMessage = "Some messages were lost in the SQS Send Batch Request",
  NoMessages = "There are no messages passed through",
  NoQueueUrl = "Queue URL not Available",
  TooManyMessages = "Too many messages are being attempting to be sent via SQS in one batch",
  NoBody = "No Body in Request",
  NotString = "Request is not a string",
  NotValidJWSStructure = "Request does not contain a valid JWS. Invalid number of sections",
  NotValidBase64 = "Request does not contain a valid Base64 string",
}
