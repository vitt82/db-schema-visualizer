export const computeTableDragEventName = (tableName: string): string => {
  return `on:table:drag:${tableName}`;
};

export const computeEnumDragEventName = (enumName: string): string => {
  return `on:enum:drag:${enumName}`;
};
