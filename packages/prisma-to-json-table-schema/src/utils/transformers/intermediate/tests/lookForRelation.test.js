"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lookForRelation_1 = require("../lookForRelation");
const data_1 = require("@/tests/data");
describe("look for relations", () => {
  test("identifier relations", () => {
    const registerRelation = jest.fn();
    const registerInverseRelation = jest.fn();
    const testTableName = "TestTable";
    (0, lookForRelation_1.lookForRelation)(
      data_1.productRelation,
      testTableName,
      registerRelation,
      registerInverseRelation,
    );
    expect(registerRelation).toHaveBeenCalledWith({
      table: testTableName,
      field: "productId",
      referenceTable: "Product",
      referenceField: "id",
    });
    expect(registerInverseRelation).not.toHaveBeenCalled();
  });
  test("will register named relation defined with keyvalue: @relation(name: 'name-here' )", () => {
    const registerRelation = jest.fn();
    const registerInverseRelation = jest.fn();
    const testTableName = "TestTable";
    (0, lookForRelation_1.lookForRelation)(
      data_1.namedRelationTable1.properties[3],
      testTableName,
      registerRelation,
      registerInverseRelation,
    );
    expect(registerRelation).toHaveBeenCalledWith({
      table: testTableName,
      field: "player1Id",
      name: '"player1"',
      referenceField: "id",
      referenceTable: "User",
    });
  });
  test("will register named relation defined without keyvalue @relation('name-here')", () => {
    const registerRelation = jest.fn();
    const registerInverseRelation = jest.fn();
    const testTableName = "TestTable";
    (0, lookForRelation_1.lookForRelation)(
      data_1.namedRelationTable1.properties[5],
      testTableName,
      registerRelation,
      registerInverseRelation,
    );
    expect(registerRelation).toHaveBeenCalledWith({
      table: testTableName,
      field: "player2Id",
      name: '"player2"',
      referenceField: "id",
      referenceTable: "User",
    });
  });
  test("will register inverse relation", () => {
    const registerRelation = jest.fn();
    const registerInverseRelation = jest.fn();
    const testTableName = "TestTable";
    (0, lookForRelation_1.lookForRelation)(
      data_1.productTable.properties[6],
      testTableName,
      registerRelation,
      registerInverseRelation,
    );
    expect(registerInverseRelation).toHaveBeenCalledWith(
      "TestTable.Order",
      "many",
    );
    expect(registerRelation).not.toHaveBeenCalled();
  });
  test("will register inverse relation with name", () => {
    const registerRelation = jest.fn();
    const registerInverseRelation = jest.fn();
    const testTableName = "TestTable";
    (0, lookForRelation_1.lookForRelation)(
      data_1.namedRelationTable2.properties[5],
      testTableName,
      registerRelation,
      registerInverseRelation,
    );
    expect(registerInverseRelation).toHaveBeenCalledWith(
      'TestTable.Match."player1"',
      "many",
    );
    expect(registerRelation).not.toHaveBeenCalled();
  });
});
