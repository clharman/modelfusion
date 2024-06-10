"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asChatMessages = void 0;
/**
 * Convert Vercel AI SDK messages to ModelFusion ChatMessages.
 */
function asChatMessages(messages) {
    return messages.filter(
    // only user and assistant roles are supported:
    (message) => message.role === "user" || message.role === "assistant");
}
exports.asChatMessages = asChatMessages;
