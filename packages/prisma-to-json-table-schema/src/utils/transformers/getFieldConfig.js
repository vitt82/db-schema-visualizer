"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldConfig = void 0;
const isTypeOf_1 = require("../isTypeOf");
const prismaAstNodeType_1 = require("../../enums/prismaAstNodeType");
// Browse column attributes to identify its configurations
const getFieldConfig = (fieldProps) => {
  if (fieldProps === undefined) return {};
  let defaultValue = null;
  let isPrimary = false;
  let incrementable = false;
  let isUniqueField = false;
  for (const prop of fieldProps) {
    switch (prop.name) {
      //
      case prismaAstNodeType_1.PrismaFieldAttributeType.default:
        if (prop.args === undefined) {
          break;
        }
        for (const defaultPropArg of prop.args) {
          // handle each case according to the value type
          // the arg is a scalar type
          if (typeof defaultPropArg.value !== "object") {
            defaultValue = defaultPropArg.value;
            break;
          }
          // the arg is KeyValue type
          if ((0, isTypeOf_1.isKeyValue)(defaultPropArg.value)) {
            // only handle the case where the value is a primitive value
            if (typeof defaultPropArg.value.value !== "object") {
              defaultValue = defaultPropArg.value.value;
            }
            break;
          }
          // the arg is a function type
          if ((0, isTypeOf_1.isFunNodeType)(defaultPropArg.value)) {
            defaultValue = defaultPropArg.value.name;
            // check if it is auto-incrementable
            if (defaultPropArg.value.name === "autoincrement") {
              incrementable = true;
            }
            break;
          }
        }
        break;
      case prismaAstNodeType_1.PrismaFieldAttributeType.id:
        isPrimary = true;
        break;
      case prismaAstNodeType_1.PrismaFieldAttributeType.unique:
        isUniqueField = true;
        break;
      default:
        break;
    }
  }
  return {
    dbdefault: defaultValue,
    increment: incrementable,
    pk: isPrimary,
    unique: isUniqueField,
  };
};
exports.getFieldConfig = getFieldConfig;
