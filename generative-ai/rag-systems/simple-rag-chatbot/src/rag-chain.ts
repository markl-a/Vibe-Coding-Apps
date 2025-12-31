import { ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import type { VectorStoreRetriever } from '@langchain/core/vectorstores';
import type { Document } from '@langchain/core/documents';

export interface RagChainConfig {
  openaiApiKey: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

const SYSTEM_TEMPLATE = `You are a helpful assistant that answers questions based on the provided context.
Use the following pieces of context to answer the question at the end.
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

Context:
{context}`;

const formatDocs = (docs: Document[]): string => {
  return docs.map((doc, i) => `[${i + 1}] ${doc.pageContent}`).join('\n\n');
};

export function createRagChain(
  retriever: VectorStoreRetriever,
  config: RagChainConfig
) {
  const model = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    modelName: config.modelName ?? 'gpt-4o-mini',
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 500,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
  ]);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  return {
    async invoke(question: string): Promise<string> {
      return await chain.invoke(question);
    },

    async stream(question: string) {
      return await chain.stream(question);
    },

    async invokeWithSources(question: string) {
      const docs = await retriever.invoke(question);
      const answer = await chain.invoke(question);
      return {
        answer,
        sources: docs.map(doc => ({
          content: doc.pageContent.substring(0, 200) + '...',
          metadata: doc.metadata,
        })),
      };
    },
  };
}
