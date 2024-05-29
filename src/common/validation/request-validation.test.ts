import { ErrorMessages } from "../enums/errors";
import { BadRequestError } from "../errors/errors";
import { RequestValidation } from "./request-validation";

const mockValidJWS: string = [
  Buffer.from("Test Header", "binary").toString("base64"),
  Buffer.from("Test Payload", "binary").toString("base64"),
  Buffer.from("Test Signature", "binary").toString("base64"),
].join(".");

describe("validateInboundEvent", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should throw a NotString Type error", () => {
    const testBody: number = 123;

    expect(() => RequestValidation.validateInboundEvent(testBody)).toThrow(
      ErrorMessages.NotString,
    );
    expect(() => RequestValidation.validateInboundEvent(testBody)).toThrow(
      BadRequestError,
    );
  });

  it("should throw a NotValidJWT Reference error", () => {
    const testBody: string = "abc.def";

    expect(() => RequestValidation.validateInboundEvent(testBody)).toThrow(
      ErrorMessages.NotValidJWSStructure,
    );
    expect(() => RequestValidation.validateInboundEvent("test")).toThrow(
      ErrorMessages.NotValidJWSStructure,
    );
  });

  it("should throw a NotValidBase64 Type error", () => {
    jest
      .spyOn(RequestValidation, "checkValidBase64")
      .mockImplementation(() => false);
    const testBody: string = "abc.def.ghi";

    expect(() => RequestValidation.validateInboundEvent(testBody)).toThrow(
      ErrorMessages.NotValidBase64,
    );
    expect(() => RequestValidation.validateInboundEvent(testBody)).toThrow(
      BadRequestError,
    );
  });

  it("should not throw if valid request", () => {
    jest
      .spyOn(RequestValidation, "checkValidBase64")
      .mockImplementation(() => true);

    expect(() =>
      RequestValidation.validateInboundEvent(mockValidJWS),
    ).not.toThrowError();
  });
});

describe("checkValidBase64", () => {
  it("should return true if valid Base64 string", () => {
    expect(
      RequestValidation.checkValidBase64(
        "eyJpc3MiOiJodHRwczovL01vY2tSUDEuYWNjb3VudC5nb3YudWsvcHVibGljS2V5LyIsImp0aSI6IjFEYzY5NzVJNDc4MW03Nnc1T3NHNCIsImlhdCI6MTY5NzU0NzgxNzY1NCwiYXVkIjoiaHR0cHM6Ly9pbmJvdW5kLnNzZi5hY2NvdW50Lmdvdi51ay8iLCJzdWIiOiJSUDFVU0VSMiIsInR4biI6Ikl3MTY5N0o1NDdlYmk4MW43NjV1NCIsInRvZSI6MTY5NzUwMjQxOTczOCwiZXZlbnRzIjp7Imh0dHBzOi8vc2NoZW1hcy5vcGVuaWQubmV0L3NlY2V2ZW50L3Jpc2MvZXZlbnQtdHlwZS9hY2NvdW50LXB1cmdlZCI6eyJzdWJqZWN0Ijp7InN1YmplY3RfdHlwZSI6Imlzc19zdWIiLCJpc3MiOiJodHRwczovL01vY2tSUDEuYWNjb3VudC5nb3YudWsvcHVibGljS2V5LyIsInN1YiI6IlJQMVVTRVIyIn19fX0",
      ),
    ).toEqual(true);
  });

  it("should return true if valid Base64 string", () => {
    const inValidBase64String = "asdonfsdj%&*";
    expect(RequestValidation.checkValidBase64(inValidBase64String)).toEqual(
      false,
    );
  });
});
