"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enumNodeToJSONTableEnum_1 = require("../enumNodeToJSONTableEnum");
const data_1 = require("@/tests/data");
describe("transform dbml enum to json table enum", () => {
  test("transform enum", () => {
    expect(
      (0, enumNodeToJSONTableEnum_1.enumNodeToJSONTableEnum)(data_1.colorEnum),
    ).toMatchObject({
      name: data_1.colorEnum.name,
      values: [
        {
          name: "Red",
        },
      ],
    });
  });
});
