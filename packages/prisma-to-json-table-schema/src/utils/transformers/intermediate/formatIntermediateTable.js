"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIntermediateTable = void 0;
const isTypeOf_1 = require("../../isTypeOf");
const formatIntermediateField_1 = require("./formatIntermediateField");
const lookForRelation_1 = require("./lookForRelation");
const formatIntermediateTable = (
  node,
  registerRawRelation,
  registerInverseRelation,
) => {
  const fields = [];
  for (const mayAField of node.properties) {
    if (!(0, isTypeOf_1.isField)(mayAField)) continue;
    const field = (0, formatIntermediateField_1.formatIntermediateTableField)(
      mayAField,
    );
    (0, lookForRelation_1.lookForRelation)(
      mayAField,
      node.name,
      registerRawRelation,
      registerInverseRelation,
    );
    fields.push(field);
  }
  return {
    fields,
    name: node.name,
    indexes: [], // TODO : also format indexes,
  };
};
exports.formatIntermediateTable = formatIntermediateTable;
