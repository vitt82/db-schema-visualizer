"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePrismaToJSON = void 0;
const prisma_ast_1 = require("@mrleebo/prisma-ast");
const diagnostic_1 = require("shared/types/diagnostic");
const prismaASTToJSONTableSchema_1 = require("./utils/transformers/prismaASTToJSONTableSchema");
const parsePrismaToJSON = (prismaCode) => {
  try {
    const rawParsedSchema = (0, prisma_ast_1.getSchema)(prismaCode);
    return (0, prismaASTToJSONTableSchema_1.prismaASTToJSONTableSchema)(
      rawParsedSchema,
    );
  } catch (error) {
    if ("token" in error) {
      const token = error.token;
      const endColumn = token.endColumn;
      const endLine = token.endLine;
      const startColumn = token.startColumn;
      const startLine = token.startLine;
      if (
        endColumn === undefined ||
        startColumn === undefined ||
        endLine === undefined ||
        startLine === undefined
      ) {
        throw error;
      }
      const locationEnd = { column: endColumn, line: endLine };
      const locationStart = {
        column: startColumn,
        line: startLine,
      };
      throw new diagnostic_1.DiagnosticError(
        {
          end: {
            column: locationEnd.column - 1,
            line: locationEnd.line - 1,
          },
          start: {
            column: locationStart.column - 1,
            line: locationStart.line - 1,
          },
        },
        String(error.message),
      );
    }
    throw error;
  }
};
exports.parsePrismaToJSON = parsePrismaToJSON;
