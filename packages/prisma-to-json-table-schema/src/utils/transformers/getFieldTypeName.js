"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldTypeName = void 0;
const getFieldTypeName = (fieldType) => {
  return typeof fieldType === "string" ? fieldType : fieldType.name;
};
exports.getFieldTypeName = getFieldTypeName;
