"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntermediateSchema = void 0;
const isTypeOf_1 = require("../../isTypeOf");
const enumNodeToJSONTableEnum_1 = require("../enumNodeToJSONTableEnum");
const formatIntermediateTable_1 = require("./formatIntermediateTable");
const createIntermediateSchema = (nodes) => {
  const enums = [];
  const tables = [];
  const enumsNames = new Set();
  const types = new Set();
  const rawRelations = [];
  const inverseRelationMap = new Map();
  const tablesNames = new Set();
  const registerInverseRelation = (name, type) => {
    inverseRelationMap.set(name, type);
  };
  const registerRawRelation = (info) => {
    rawRelations.push(info);
  };
  for (const node of nodes) {
    if ((0, isTypeOf_1.isEnumNode)(node)) {
      const _enum = (0, enumNodeToJSONTableEnum_1.enumNodeToJSONTableEnum)(
        node,
      );
      enumsNames.add(_enum.name);
      enums.push(_enum);
    }
    if ((0, isTypeOf_1.isModelNode)(node)) {
      tablesNames.add(node.name);
      tables.push(
        (0, formatIntermediateTable_1.formatIntermediateTable)(
          node,
          registerRawRelation,
          registerInverseRelation,
        ),
      );
    }
    if ((0, isTypeOf_1.isTypeNode)(node)) {
      types.add(node.name);
    }
  }
  return {
    enums,
    tables,
    enumsNames,
    rawRelations,
    inverseRelationMap,
    tablesNames,
  };
};
exports.createIntermediateSchema = createIntermediateSchema;
