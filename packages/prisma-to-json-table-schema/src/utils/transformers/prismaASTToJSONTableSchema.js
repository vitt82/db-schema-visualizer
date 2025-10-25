"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaASTToJSONTableSchema = void 0;
const createIntermediateSchema_1 = require("./intermediate/createIntermediateSchema");
const createRefsFromPrismaASTNodes_1 = require("./createRefsFromPrismaASTNodes");
const intermediateTableToJSONTableTable_1 = require("./intermediateTableToJSONTableTable");
const prismaASTToJSONTableSchema = (prismaAST) => {
  const {
    enums,
    tables: intermediateTables,
    enumsNames,
    rawRelations,
    inverseRelationMap,
    tablesNames,
  } = (0, createIntermediateSchema_1.createIntermediateSchema)(prismaAST.list);
  const [refs, fieldRelationsArray] = (0,
  createRefsFromPrismaASTNodes_1.createRefsAndFieldRelationsArray)(
    rawRelations,
    inverseRelationMap,
    tablesNames,
  );
  const tables = intermediateTables.map((intermediateTable) => {
    return (0,
    intermediateTableToJSONTableTable_1.intermediateTableToJSONTableTable)(
      intermediateTable,
      enumsNames,
      fieldRelationsArray,
      tablesNames,
    );
  });
  return { tables, enums, refs };
};
exports.prismaASTToJSONTableSchema = prismaASTToJSONTableSchema;
