"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookForRelation = void 0;
const getFieldTypeName_1 = require("../getFieldTypeName");
const scalarFieldType_1 = require("../../../constants/scalarFieldType");
const isTypeOf_1 = require("../../isTypeOf");
const lookForRelation = (
  field,
  tableName,
  registerRelation,
  registerInverseRelation,
) => {
  const fieldType = (0, getFieldTypeName_1.getFieldTypeName)(field.fieldType);
  let relationFields = [];
  let relationReferences = [];
  let relationName;
  if (field.attributes !== undefined) {
    for (const attr of field.attributes) {
      if (attr.args === undefined || !(0, isTypeOf_1.isRelationNode)(attr))
        continue;
      for (const argument of attr.args) {
        if (typeof argument.value === "string") {
          relationName = argument.value;
          continue;
        }
        if (!(0, isTypeOf_1.isKeyValue)(argument.value)) {
          continue;
        }
        if (
          argument.value.key === "name" &&
          typeof argument.value.value === "string"
        ) {
          relationName = argument.value.value;
        }
        if (!(0, isTypeOf_1.isRelationArray)(argument.value.value)) continue;
        if (argument.value.key === "fields") {
          relationFields = argument.value.value.args;
        }
        if (argument.value.key === "references") {
          relationReferences = argument.value.value.args;
        }
      }
      if (
        relationFields.length > 0 &&
        relationFields.length === relationReferences.length
      ) {
        relationReferences.forEach((referenceField) => {
          registerRelation({
            referenceField,
            referenceTable: fieldType,
            table: tableName,
            field: relationFields[0],
            name: relationName,
          });
        });
        return;
      }
    }
  }
  // check if the field is maybe a inverse relation
  // that is the if is not a scalar type and not a composite type
  if (scalarFieldType_1.scalarFieldType.has(fieldType)) {
    return;
  }
  const inverseKeyPrefix = `${tableName}.${fieldType}`;
  registerInverseRelation(
    relationName !== undefined
      ? `${inverseKeyPrefix}.${relationName}`
      : inverseKeyPrefix,
    field.array === true ? "many" : "one",
  );
};
exports.lookForRelation = lookForRelation;
