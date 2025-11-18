"""
Question Answering System
使用 Transformers 建立智能問答系統
支援：
- Extractive QA (從文本中提取答案)
- Multi-document QA
- Conversational QA
- Open-domain QA (可選)
"""

from transformers import pipeline, AutoTokenizer, AutoModelForQuestionAnswering
import torch
from typing import List, Dict, Optional, Tuple
import warnings

warnings.filterwarnings('ignore')


class QuestionAnsweringSystem:
    """Intelligent Question Answering System"""

    def __init__(
        self,
        model_name: str = "distilbert-base-cased-distilled-squad",
        device: Optional[str] = None
    ):
        """
        Initialize QA system

        Args:
            model_name: Pre-trained QA model name
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        if device is None:
            self.device = 0 if torch.cuda.is_available() else -1
        else:
            self.device = 0 if device == 'cuda' else -1

        print(f"Loading QA model: {model_name}")
        print(f"Using device: {'GPU' if self.device == 0 else 'CPU'}")

        try:
            self.qa_pipeline = pipeline(
                "question-answering",
                model=model_name,
                device=self.device
            )
            self.model_name = model_name
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Model loading failed: {e}")
            raise

    def answer(
        self,
        question: str,
        context: str,
        top_k: int = 1,
        max_answer_len: int = 50
    ) -> Dict:
        """
        Answer a question based on context

        Args:
            question: The question to answer
            context: Context text containing the answer
            top_k: Number of top answers to return
            max_answer_len: Maximum answer length

        Returns:
            Dictionary with answer and metadata
        """
        if not question or not question.strip():
            return {"error": "Question cannot be empty"}

        if not context or not context.strip():
            return {"error": "Context cannot be empty"}

        try:
            result = self.qa_pipeline(
                question=question,
                context=context,
                top_k=top_k,
                max_answer_len=max_answer_len
            )

            # Handle single answer vs multiple answers
            if isinstance(result, dict):
                result = [result]

            formatted_results = []
            for ans in result:
                formatted_results.append({
                    'answer': ans['answer'],
                    'score': float(ans['score']),
                    'start': ans['start'],
                    'end': ans['end']
                })

            return {
                'question': question,
                'answers': formatted_results,
                'best_answer': formatted_results[0]['answer'],
                'confidence': formatted_results[0]['score']
            }

        except Exception as e:
            return {
                'error': str(e),
                'question': question
            }

    def answer_multiple_contexts(
        self,
        question: str,
        contexts: List[str],
        top_k: int = 3
    ) -> List[Dict]:
        """
        Answer question using multiple context documents

        Args:
            question: The question
            contexts: List of context documents
            top_k: Number of top answers to return

        Returns:
            List of answers with their contexts
        """
        all_answers = []

        for idx, context in enumerate(contexts):
            result = self.answer(question, context, top_k=1)

            if 'error' not in result:
                all_answers.append({
                    'context_id': idx,
                    'context': context[:200] + '...' if len(context) > 200 else context,
                    'answer': result['best_answer'],
                    'confidence': result['confidence'],
                    'full_context': context
                })

        # Sort by confidence
        all_answers.sort(key=lambda x: x['confidence'], reverse=True)

        return all_answers[:top_k]

    def answer_batch(
        self,
        questions: List[str],
        context: str
    ) -> List[Dict]:
        """
        Answer multiple questions for the same context

        Args:
            questions: List of questions
            context: Single context for all questions

        Returns:
            List of answers
        """
        results = []

        for question in questions:
            result = self.answer(question, context)
            results.append(result)

        return results

    def get_context_snippet(
        self,
        answer: str,
        context: str,
        window: int = 100
    ) -> str:
        """
        Get context snippet around the answer

        Args:
            answer: The answer text
            context: Full context
            window: Characters to include before/after answer

        Returns:
            Context snippet
        """
        try:
            idx = context.lower().find(answer.lower())
            if idx == -1:
                return context[:200] + "..."

            start = max(0, idx - window)
            end = min(len(context), idx + len(answer) + window)

            snippet = context[start:end]

            if start > 0:
                snippet = "..." + snippet
            if end < len(context):
                snippet = snippet + "..."

            return snippet
        except:
            return context[:200] + "..."

    def ask_conversational(
        self,
        questions: List[str],
        context: str
    ) -> List[Dict]:
        """
        Conversational QA - maintain context across questions

        Args:
            questions: List of questions in conversation order
            context: Context document

        Returns:
            List of Q&A pairs
        """
        conversation = []

        for question in questions:
            result = self.answer(question, context)

            if 'error' not in result:
                conversation.append({
                    'question': question,
                    'answer': result['best_answer'],
                    'confidence': result['confidence']
                })
            else:
                conversation.append({
                    'question': question,
                    'answer': "Unable to answer",
                    'confidence': 0.0,
                    'error': result.get('error', 'Unknown error')
                })

        return conversation

    def verify_answer(
        self,
        question: str,
        answer: str,
        context: str
    ) -> Dict:
        """
        Verify if a given answer is correct for a question

        Args:
            question: The question
            answer: Proposed answer
            context: Context

        Returns:
            Verification result
        """
        predicted = self.answer(question, context)

        if 'error' in predicted:
            return {
                'verified': False,
                'reason': 'Could not generate answer',
                'error': predicted['error']
            }

        predicted_answer = predicted['best_answer'].lower()
        given_answer = answer.lower()

        # Check if answers match (exact or contained)
        exact_match = predicted_answer == given_answer
        contains_match = given_answer in predicted_answer or predicted_answer in given_answer

        return {
            'verified': exact_match or contains_match,
            'exact_match': exact_match,
            'given_answer': answer,
            'predicted_answer': predicted['best_answer'],
            'confidence': predicted['confidence']
        }


def main():
    """Example usage demonstrating QA system features"""
    print("=" * 80)
    print("Question Answering System Demo")
    print("=" * 80)

    # Initialize QA system
    qa = QuestionAnsweringSystem()

    # Sample context about AI
    context = """
    Artificial intelligence (AI) is intelligence demonstrated by machines,
    in contrast to the natural intelligence displayed by humans and animals.
    Leading AI textbooks define the field as the study of "intelligent agents":
    any device that perceives its environment and takes actions that maximize
    its chance of successfully achieving its goals.

    The term "artificial intelligence" was coined by John McCarthy in 1956 at
    the Dartmouth Conference. AI research has been defined as the field of study
    of intelligent agents, which refers to any system that perceives its environment
    and takes actions that maximize its chance of achieving its goals.

    Modern AI techniques include machine learning, deep learning, natural language
    processing, and computer vision. Machine learning algorithms build a mathematical
    model based on sample data, known as "training data", in order to make predictions
    or decisions without being explicitly programmed to do so. Deep learning is a
    subset of machine learning that uses neural networks with multiple layers.

    AI has been used in a wide variety of fields including healthcare, finance,
    transportation, and entertainment. In healthcare, AI is used for diagnosis,
    drug discovery, and personalized medicine. The global AI market was valued at
    $62.35 billion in 2020 and is expected to grow significantly in the coming years.
    """

    print("\n" + "=" * 80)
    print("Single Question Answering")
    print("=" * 80)

    print(f"\nContext: {context[:200]}...\n")

    questions = [
        "Who coined the term artificial intelligence?",
        "When was the term AI coined?",
        "What is machine learning?",
        "Where was AI first discussed?",
        "What are modern AI techniques?"
    ]

    for question in questions:
        print(f"\nQ: {question}")
        result = qa.answer(question, context)

        if 'error' not in result:
            print(f"A: {result['best_answer']}")
            print(f"   Confidence: {result['confidence']:.4f}")
        else:
            print(f"Error: {result['error']}")

    # Multiple answers
    print("\n" + "=" * 80)
    print("Getting Multiple Possible Answers")
    print("=" * 80)

    question = "What is AI used for?"
    print(f"\nQ: {question}\n")

    result = qa.answer(question, context, top_k=3)

    if 'error' not in result:
        print("Top 3 possible answers:")
        for i, ans in enumerate(result['answers'], 1):
            print(f"\n{i}. {ans['answer']}")
            print(f"   Confidence: {ans['score']:.4f}")

    # Multi-document QA
    print("\n" + "=" * 80)
    print("Multi-Document Question Answering")
    print("=" * 80)

    contexts = [
        """Python is a high-level programming language. It was created by
        Guido van Rossum and first released in 1991. Python is known for
        its simple syntax and readability.""",

        """JavaScript is a programming language commonly used for web development.
        It was created by Brendan Eich in 1995. JavaScript runs in web browsers
        and enables interactive web pages.""",

        """Java is a general-purpose programming language. It was developed by
        James Gosling at Sun Microsystems and released in 1995. Java is designed
        to be platform-independent."""
    ]

    question = "Who created Python?"
    print(f"\nQ: {question}")
    print("\nSearching across 3 documents...")

    results = qa.answer_multiple_contexts(question, contexts, top_k=2)

    print("\nTop answers from different documents:")
    for i, res in enumerate(results, 1):
        print(f"\n{i}. Answer: {res['answer']}")
        print(f"   Confidence: {res['confidence']:.4f}")
        print(f"   Context: {res['context']}")

    # Batch questions
    print("\n" + "=" * 80)
    print("Batch Question Answering")
    print("=" * 80)

    batch_questions = [
        "What is Python known for?",
        "When was Python released?",
        "Who created Python?"
    ]

    python_context = contexts[0]

    print(f"\nContext: {python_context}\n")
    print("Questions:")
    for q in batch_questions:
        print(f"  - {q}")

    results = qa.answer_batch(batch_questions, python_context)

    print("\nAnswers:")
    for q, r in zip(batch_questions, results):
        if 'error' not in r:
            print(f"\nQ: {q}")
            print(f"A: {r['best_answer']} (confidence: {r['confidence']:.4f})")

    # Conversational QA
    print("\n" + "=" * 80)
    print("Conversational QA")
    print("=" * 80)

    conv_questions = [
        "What is artificial intelligence?",
        "Who coined this term?",
        "What are some AI techniques?"
    ]

    print("\nConversation:")
    conversation = qa.ask_conversational(conv_questions, context)

    for turn in conversation:
        print(f"\nQ: {turn['question']}")
        print(f"A: {turn['answer']}")
        if 'error' not in turn:
            print(f"   (confidence: {turn['confidence']:.4f})")

    # Answer verification
    print("\n" + "=" * 80)
    print("Answer Verification")
    print("=" * 80)

    test_cases = [
        ("Who coined the term AI?", "John McCarthy"),
        ("Who coined the term AI?", "Alan Turing"),
        ("When was AI coined?", "1956")
    ]

    for question, answer in test_cases:
        print(f"\nQ: {question}")
        print(f"Proposed Answer: {answer}")

        verification = qa.verify_answer(question, answer, context)

        print(f"Verified: {'✓' if verification['verified'] else '✗'}")
        print(f"Model's Answer: {verification.get('predicted_answer', 'N/A')}")
        if not verification['verified']:
            print(f"Reason: Answers don't match")


if __name__ == "__main__":
    main()
