"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticError = void 0;
class DiagnosticError extends Error {
  constructor(location, message) {
    super(message);
    this.location = location;
    this.message = message;
  }
}
exports.DiagnosticError = DiagnosticError;
