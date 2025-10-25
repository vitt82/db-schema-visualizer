"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intermediateTableToJSONTableTable = void 0;
const intermediateFieldToJSONTableField_1 = require("./intermediateFieldToJSONTableField");
const intermediateTableToJSONTableTable = (
  { fields: intermediateFields, name, indexes },
  enumsSet,
  fieldRelationTable,
  tablesSet,
) => {
  const fields = [];
  for (let index = 0; index < intermediateFields.length; index++) {
    const intermediateField = intermediateFields[index];
    /*
        VirtualReferenceField is field that not a column in the database
        but just a reference field for Prisma to allow navigation between
        relationships.
        */
    const isVirtualReferenceField = tablesSet.has(
      intermediateField.type.type_name,
    );
    if (isVirtualReferenceField) {
      continue;
    }
    const field = (0,
    intermediateFieldToJSONTableField_1.intermediateFieldToJSONTableField)(
      name,
      intermediateField,
      enumsSet,
      fieldRelationTable,
    );
    fields.push(field);
  }
  return { name, fields, indexes };
};
exports.intermediateTableToJSONTableTable = intermediateTableToJSONTableTable;
