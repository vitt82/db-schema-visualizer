export interface JSONTableGroup {
  id: string;
  name: string;
  color?: string;
  tableNames: string[]; // nombres de las tablas que pertenecen a este grupo
  enumNames?: string[]; // nombres de los enums que pertenecen a este grupo
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
