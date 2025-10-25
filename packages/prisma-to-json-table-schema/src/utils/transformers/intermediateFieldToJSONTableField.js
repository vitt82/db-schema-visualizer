"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intermediateFieldToJSONTableField = void 0;
const computeKey_1 = require("../computeKey");
const intermediateFieldToJSONTableField = (
  tableName,
  intermediateField,
  enumsSet,
  fieldRelationTable,
) => {
  const isEnum = enumsSet.has(intermediateField.type.type_name);
  const keyInFieldRelationTable = (0, computeKey_1.computeKey)(
    tableName,
    intermediateField.name,
  );
  const relationship = fieldRelationTable.get(keyInFieldRelationTable);
  const field = Object.assign(Object.assign({}, intermediateField), {
    type: {
      type_name:
        intermediateField.type.many === true
          ? `${intermediateField.type.type_name} [ ]`
          : intermediateField.type.type_name,
      is_enum: isEnum,
    },
    is_relation: relationship !== undefined && relationship.length > 0,
    relational_tables: relationship,
  });
  return field;
};
exports.intermediateFieldToJSONTableField = intermediateFieldToJSONTableField;
