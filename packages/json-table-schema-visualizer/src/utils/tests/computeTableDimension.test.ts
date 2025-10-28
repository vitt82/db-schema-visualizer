import { computeTableDimension } from "../computeTableDimension";

import { exampleData } from "@/fake/fakeJsonTables";
import {
  TABLE_HEADER_HEIGHT,
  TABLE_DEFAULT_MIN_WIDTH,
  COLUMN_HEIGHT,
} from "@/constants/sizing";

describe("compute table dimension", () => {
  test("compute table dimension", () => {
    const table = exampleData.tables[0];
    expect(computeTableDimension(table)).toEqual({
      width: TABLE_DEFAULT_MIN_WIDTH,
      height: TABLE_HEADER_HEIGHT + COLUMN_HEIGHT * table.fields.length,
    });
  });
});
