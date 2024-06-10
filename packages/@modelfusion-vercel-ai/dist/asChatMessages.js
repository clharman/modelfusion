/**
 * Convert Vercel AI SDK messages to ModelFusion ChatMessages.
 */
export function asChatMessages(messages) {
    return messages.filter(
    // only user and assistant roles are supported:
    (message) => message.role === "user" || message.role === "assistant");
}
