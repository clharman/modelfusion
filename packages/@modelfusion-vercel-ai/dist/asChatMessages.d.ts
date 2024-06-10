import { Message } from "ai";
import { ChatMessage } from "modelfusion";
/**
 * Convert Vercel AI SDK messages to ModelFusion ChatMessages.
 */
export declare function asChatMessages(messages: Message[]): ChatMessage[];
