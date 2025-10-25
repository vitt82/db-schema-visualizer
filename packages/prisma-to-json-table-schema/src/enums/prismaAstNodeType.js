"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaFieldAttributeType = exports.PrismaAstNodeType = void 0;
var PrismaAstNodeType;
(function (PrismaAstNodeType) {
  PrismaAstNodeType["schema"] = "schema";
  PrismaAstNodeType["model"] = "model";
  PrismaAstNodeType["type"] = "type";
  PrismaAstNodeType["view"] = "view";
  PrismaAstNodeType["datasource"] = "datasource";
  PrismaAstNodeType["generator"] = "generator";
  PrismaAstNodeType["enum"] = "enum";
  PrismaAstNodeType["comment"] = "comment";
  PrismaAstNodeType["break"] = "break";
  PrismaAstNodeType["assignment"] = "assignment";
  PrismaAstNodeType["enumerator"] = "enumerator";
  PrismaAstNodeType["attribute"] = "attribute";
  PrismaAstNodeType["field"] = "field";
  PrismaAstNodeType["attributeArgument"] = "attributeArgument";
  PrismaAstNodeType["keyValue"] = "keyValue";
  PrismaAstNodeType["array"] = "array";
  PrismaAstNodeType["function"] = "function";
})(PrismaAstNodeType || (exports.PrismaAstNodeType = PrismaAstNodeType = {}));
var PrismaFieldAttributeType;
(function (PrismaFieldAttributeType) {
  PrismaFieldAttributeType["default"] = "default";
  PrismaFieldAttributeType["id"] = "id";
  PrismaFieldAttributeType["unique"] = "unique";
  PrismaFieldAttributeType["relation"] = "relation";
})(
  PrismaFieldAttributeType ||
    (exports.PrismaFieldAttributeType = PrismaFieldAttributeType = {}),
);
