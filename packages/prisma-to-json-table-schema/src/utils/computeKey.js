"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeKey = void 0;
const computeKey = (...tags) => tags.join(".");
exports.computeKey = computeKey;
