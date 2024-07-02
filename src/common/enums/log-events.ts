export enum LogEvents {
  StartedProcessing = "Started Processing",
  SuccessfullyProcessed = "Successfully Processed",
  ErrorProcessing = "Error Processing",
  JWEDecryptSuccess = "Successfully decrypted JWE",
  JWSVerifySuccess = "Successfully verified JWS",
  FullSQSBatchGenerated = "Successfully sent all SQS Batch messages",
  PartialSQSBatchGenerated = "Failed to send some attempted SQS Batch messages",
  FailedSQSBatchGenerated = "Failed to send all attempted SQS Batch messages",
}
