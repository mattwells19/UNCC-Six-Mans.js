import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export class InvalidCommand extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Invalid command";
  }
}

export function isRecordNotFoundError(err: unknown): err is RecordNotFound {
  return err instanceof PrismaClientKnownRequestError && err.code === "P2025";
}

export class RecordNotFound extends PrismaClientKnownRequestError {
  constructor(message: string) {
    super(message, "P2025", "3");
  }
}
