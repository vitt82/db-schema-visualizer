"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTypeNode =
  exports.isFunNodeType =
  exports.isDefaultFieldValueNode =
  exports.isRelationArray =
  exports.isRelationNode =
  exports.isKeyValue =
  exports.isRelationFieldAttr =
  exports.isField =
  exports.isModelNode =
  exports.isEnumeratorNode =
  exports.isEnumNode =
    void 0;
const prismaAstNodeType_1 = require("../enums/prismaAstNodeType");
const isEnumNode = (node) => {
  return node.type === prismaAstNodeType_1.PrismaAstNodeType.enum;
};
exports.isEnumNode = isEnumNode;
const isEnumeratorNode = (node) => {
  return node.type === prismaAstNodeType_1.PrismaAstNodeType.enumerator;
};
exports.isEnumeratorNode = isEnumeratorNode;
const isModelNode = (node) => {
  return node.type === prismaAstNodeType_1.PrismaAstNodeType.model;
};
exports.isModelNode = isModelNode;
const isField = (node) => {
  return node.type === prismaAstNodeType_1.PrismaAstNodeType.field;
};
exports.isField = isField;
const isRelationFieldAttr = (node) => {
  return (
    node.type === prismaAstNodeType_1.PrismaAstNodeType.attribute &&
    node.name === "relation"
  );
};
exports.isRelationFieldAttr = isRelationFieldAttr;
const isKeyValue = (node) => {
  return (
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.type === prismaAstNodeType_1.PrismaAstNodeType.keyValue
  );
};
exports.isKeyValue = isKeyValue;
const isRelationNode = (node) => {
  return (
    node.type === prismaAstNodeType_1.PrismaAstNodeType.attribute &&
    node.name === prismaAstNodeType_1.PrismaFieldAttributeType.relation
  );
};
exports.isRelationNode = isRelationNode;
const isRelationArray = (node) => {
  return (
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.type === prismaAstNodeType_1.PrismaAstNodeType.array &&
    Array.isArray(node.args)
  );
};
exports.isRelationArray = isRelationArray;
const isDefaultFieldValueNode = (node) => {
  return (
    node.type === prismaAstNodeType_1.PrismaAstNodeType.attribute &&
    node.name === "default"
  );
};
exports.isDefaultFieldValueNode = isDefaultFieldValueNode;
const isFunNodeType = (node) => {
  return (
    !Array.isArray(node) &&
    node.type === prismaAstNodeType_1.PrismaAstNodeType.function
  );
};
exports.isFunNodeType = isFunNodeType;
const isTypeNode = (node) => {
  return node.type === prismaAstNodeType_1.PrismaAstNodeType.type;
};
exports.isTypeNode = isTypeNode;
