"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIntermediateTableField = void 0;
const getFieldTypeName_1 = require("../getFieldTypeName");
const getFieldConfig_1 = require("../getFieldConfig");
const formatIntermediateTableField = (node) => {
  const fieldConfig = (0, getFieldConfig_1.getFieldConfig)(node.attributes);
  return Object.assign(
    {
      name: node.name,
      type: {
        type_name: (0, getFieldTypeName_1.getFieldTypeName)(node.fieldType),
        many: node.array,
      },
      not_null: node.optional === undefined ? true : !node.optional,
    },
    fieldConfig,
  );
};
exports.formatIntermediateTableField = formatIntermediateTableField;
