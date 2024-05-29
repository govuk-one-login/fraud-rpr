import { Base64 } from "js-base64";
import { ErrorMessages } from "../enums/errors";
import { BadRequestError } from "../errors/errors";

export class RequestValidation {
  static readonly jwsSectionCount: number = 3;

  /**
   * Validate Inbound API request body for correct structure
   *
   * @param requestBody
   */
  static validateInboundEvent(requestBody: unknown) {
    if (typeof requestBody !== "string")
      throw new BadRequestError(ErrorMessages.NotString);

    const payloadSections: string[] = requestBody.split(".");
    if (
      payloadSections.length !== RequestValidation.jwsSectionCount ||
      !payloadSections.every((section) => !!section)
    )
      throw new BadRequestError(ErrorMessages.NotValidJWSStructure);

    if (
      !payloadSections.every((section) =>
        RequestValidation.checkValidBase64(section),
      )
    )
      throw new BadRequestError(ErrorMessages.NotValidBase64);
  }

  /**
   * Check Base64 string is valid using Regex pattern
   *
   * @param inputString
   * @returns true if `inputString` is valid base 64
   */
  static checkValidBase64(inputString: string): boolean {
    return Base64.isValid(inputString);
  }
}
