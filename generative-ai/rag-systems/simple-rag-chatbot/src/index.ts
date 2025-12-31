/**
 * Simple RAG Chatbot
 *
 * A Retrieval-Augmented Generation chatbot using LangChain and OpenAI.
 * This example demonstrates:
 * - Document loading and chunking
 * - Vector store creation with ChromaDB
 * - Retrieval chain for context-aware responses
 */

export { createRagChain, type RagChainConfig } from './rag-chain.js';
export { DocumentLoader } from './document-loader.js';
export { VectorStoreManager } from './vector-store.js';
