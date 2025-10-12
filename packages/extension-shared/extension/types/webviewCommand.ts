import { type JSONTableSchema } from "shared/types/tableSchema";

export enum WebviewCommand {
  SET_THEME_PREFERENCES = "SET_THEME_PREFERENCES",
  REFRESH_SCHEMA = "REFRESH_SCHEMA",
}

export interface WebviewPostMessage {
  command: WebviewCommand;
  message: string;
}

export interface SetSchemaCommandPayload {
  type: string;
  payload: JSONTableSchema;
  key: string;
}
