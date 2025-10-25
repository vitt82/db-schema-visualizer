"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumNodeToJSONTableEnum = void 0;
const isTypeOf_1 = require("../isTypeOf");
const enumNodeToJSONTableEnum = (node) => {
  const values = [];
  for (const enumerator of node.enumerators) {
    if ((0, isTypeOf_1.isEnumeratorNode)(enumerator)) {
      values.push({
        name: enumerator.name,
        note: enumerator.comment,
      });
    }
  }
  const _enum = {
    values,
    name: node.name,
  };
  return _enum;
};
exports.enumNodeToJSONTableEnum = enumNodeToJSONTableEnum;
