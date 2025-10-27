import { type JSONTableSchema } from "shared/types/tableSchema";

export enum WebviewCommand {
  SET_THEME_PREFERENCES = "SET_THEME_PREFERENCES",
  REFRESH_SCHEMA = "REFRESH_SCHEMA",
  FILE_WRITE = "FILE_WRITE",
  FILE_DELETE = "FILE_DELETE",
  FILE_RESPONSE = "FILE_RESPONSE",
  // webview -> host acknowledgement that schema was received and processed
  SCHEMA_RECEIVED = "SCHEMA_RECEIVED",
  // webview -> host runtime error inside the webview
  WEBVIEW_ERROR = "WEBVIEW_ERROR",
  // webview -> host after successful render with counts
  WEBVIEW_RENDERED = "WEBVIEW_RENDERED",
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
