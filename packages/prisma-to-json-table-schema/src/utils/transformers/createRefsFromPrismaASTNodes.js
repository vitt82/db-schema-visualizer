"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefsAndFieldRelationsArray = void 0;
const computeKey_1 = require("../computeKey");
const createRefsAndFieldRelationsArray = (
  rawRelations,
  inverseRelationMap,
  tablesNames,
) => {
  const refs = [];
  const allFieldRelations = new Map();
  const appendFieldRelation = (fieldKey, relationName) => {
    var _a;
    if (allFieldRelations.has(fieldKey)) {
      (_a = allFieldRelations.get(fieldKey)) === null || _a === void 0
        ? void 0
        : _a.push(relationName);
    } else {
      allFieldRelations.set(fieldKey, [relationName]);
    }
  };
  rawRelations.forEach((relation) => {
    // check if invest relationship exists
    if (
      // check all table exists
      !tablesNames.has(relation.table) &&
      !tablesNames.has(relation.referenceTable)
    )
      return;
    const id = (0, computeKey_1.computeKey)(
      relation.referenceTable,
      relation.table,
      ...(relation.name !== undefined ? [relation.name] : []),
    );
    const relationType = inverseRelationMap.get(id);
    if (relationType === undefined) return;
    const ref = {
      name: relation.name,
      endpoints: [
        {
          relation: "1",
          tableName: relation.referenceTable,
          fieldNames: [relation.referenceField],
        },
        {
          relation: relationType === "many" ? "*" : "1",
          fieldNames: [relation.field],
          tableName: relation.table,
        },
      ],
    };
    refs.push(ref);
    appendFieldRelation(
      (0, computeKey_1.computeKey)(
        relation.referenceTable,
        relation.referenceField,
      ),
      relation.table,
    );
    appendFieldRelation(
      (0, computeKey_1.computeKey)(relation.table, relation.field),
      relation.referenceTable,
    );
  });
  return [refs, allFieldRelations];
};
exports.createRefsAndFieldRelationsArray = createRefsAndFieldRelationsArray;
