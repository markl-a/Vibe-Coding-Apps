"""
Streamlit UI for NLP Tasks
"""
import streamlit as st
from sentiment_analyzer import SentimentAnalyzer
from keyword_extractor import KeywordExtractor


def main():
    """Main Streamlit app"""
    st.set_page_config(
        page_title="NLP Toolkit",
        page_icon="🔤",
        layout="wide"
    )

    st.title("🔤 Natural Language Processing Toolkit")
    st.markdown("Analyze text using various NLP techniques")

    # Sidebar
    with st.sidebar:
        st.header("Choose NLP Task")
        task = st.selectbox(
            "Task",
            [
                "Sentiment Analysis",
                "Keyword Extraction",
                "Text Statistics"
            ]
        )

    # Main content
    if task == "Sentiment Analysis":
        sentiment_analysis_page()
    elif task == "Keyword Extraction":
        keyword_extraction_page()
    elif task == "Text Statistics":
        text_statistics_page()


def sentiment_analysis_page():
    """Sentiment analysis page"""
    st.header("😊 Sentiment Analysis")
    st.markdown("Analyze the sentiment of text (positive/negative)")

    # Initialize analyzer
    if 'sentiment_analyzer' not in st.session_state:
        with st.spinner("Loading sentiment model..."):
            st.session_state.sentiment_analyzer = SentimentAnalyzer()

    # Input method
    input_method = st.radio(
        "Input method",
        ["Single text", "Multiple texts (one per line)"]
    )

    if input_method == "Single text":
        text = st.text_area(
            "Enter text to analyze",
            height=150,
            placeholder="Type your text here..."
        )

        if st.button("Analyze Sentiment", type="primary"):
            if text.strip():
                with st.spinner("Analyzing..."):
                    result = st.session_state.sentiment_analyzer.analyze(text)

                # Display result
                col1, col2 = st.columns(2)

                with col1:
                    st.metric("Sentiment", result['label'])

                with col2:
                    st.metric("Confidence", f"{result['score']:.2%}")

                # Visualization
                sentiment_color = "green" if result['label'] == "POSITIVE" else "red"
                st.markdown(
                    f"<div style='padding: 20px; background-color: {sentiment_color}20; "
                    f"border-left: 5px solid {sentiment_color}; border-radius: 5px;'>"
                    f"<strong>{result['label']}</strong> sentiment with "
                    f"<strong>{result['score']:.1%}</strong> confidence"
                    f"</div>",
                    unsafe_allow_html=True
                )
            else:
                st.warning("Please enter some text")

    else:  # Multiple texts
        texts = st.text_area(
            "Enter multiple texts (one per line)",
            height=200,
            placeholder="Text 1\nText 2\nText 3..."
        )

        if st.button("Analyze All", type="primary"):
            if texts.strip():
                text_list = [t.strip() for t in texts.split('\n') if t.strip()]

                with st.spinner(f"Analyzing {len(text_list)} texts..."):
                    results = st.session_state.sentiment_analyzer.analyze_batch(text_list)

                # Display results
                st.subheader("Results")

                for i, result in enumerate(results, 1):
                    sentiment_emoji = "😊" if result['label'] == "POSITIVE" else "😞"
                    st.write(
                        f"{i}. {sentiment_emoji} **{result['label']}** "
                        f"({result['score']:.1%}): {result['text']}"
                    )

                # Distribution
                st.subheader("Sentiment Distribution")
                distribution = st.session_state.sentiment_analyzer.get_sentiment_distribution(text_list)

                import pandas as pd
                df = pd.DataFrame(
                    list(distribution.items()),
                    columns=['Sentiment', 'Count']
                )

                st.bar_chart(df.set_index('Sentiment'))


def keyword_extraction_page():
    """Keyword extraction page"""
    st.header("🔑 Keyword Extraction")
    st.markdown("Extract important keywords and phrases from text")

    # Initialize extractor
    extractor = KeywordExtractor()

    # Input
    text = st.text_area(
        "Enter text",
        height=200,
        placeholder="Paste your text here..."
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        method = st.selectbox("Method", ["frequency", "tfidf"])

    with col2:
        top_n = st.slider("Number of keywords", 5, 20, 10)

    with col3:
        extract_phrases = st.checkbox("Extract phrases")

    if st.button("Extract Keywords", type="primary"):
        if text.strip():
            with st.spinner("Extracting keywords..."):
                # Extract keywords
                keywords = extractor.extract(text, top_n=top_n, method=method)

                # Display keywords
                st.subheader("Keywords")

                col1, col2 = st.columns([2, 1])

                with col1:
                    for i, (word, score) in enumerate(keywords, 1):
                        st.write(f"{i}. **{word}** - Score: {score:.3f}")

                with col2:
                    # Visualize as word cloud (simple bar chart)
                    import pandas as pd
                    df = pd.DataFrame(keywords, columns=['Keyword', 'Score'])
                    st.bar_chart(df.set_index('Keyword'))

                # Extract phrases if requested
                if extract_phrases:
                    st.subheader("Key Phrases (Bigrams)")
                    phrases = extractor.extract_phrases(text, n_gram=2, top_n=10)

                    for i, (phrase, freq) in enumerate(phrases, 1):
                        st.write(f"{i}. **{phrase}** - Frequency: {freq}")
        else:
            st.warning("Please enter some text")


def text_statistics_page():
    """Text statistics page"""
    st.header("📈 Text Statistics")
    st.markdown("Get detailed statistics about your text")

    text = st.text_area(
        "Enter text",
        height=200,
        placeholder="Paste your text here..."
    )

    if st.button("Analyze", type="primary"):
        if text.strip():
            # Calculate statistics
            words = text.split()
            sentences = text.split('.')
            characters = len(text)
            characters_no_spaces = len(text.replace(' ', ''))

            # Display statistics
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                st.metric("Characters", characters)

            with col2:
                st.metric("Words", len(words))

            with col3:
                st.metric("Sentences", len(sentences))

            with col4:
                avg_word_length = characters_no_spaces / len(words) if words else 0
                st.metric("Avg Word Length", f"{avg_word_length:.1f}")

            # Word frequency
            st.subheader("Most Common Words")

            from collections import Counter
            import pandas as pd

            # Clean words
            clean_words = [
                w.lower().strip('.,!?;:()[]{}"\'-')
                for w in words
                if len(w) > 3
            ]

            word_freq = Counter(clean_words).most_common(10)

            df = pd.DataFrame(word_freq, columns=['Word', 'Frequency'])
            st.dataframe(df)

            st.bar_chart(df.set_index('Word'))

            # Reading time
            st.subheader("Reading Time")
            reading_speed = 200  # words per minute
            reading_time = len(words) / reading_speed
            st.info(f"Estimated reading time: {reading_time:.1f} minutes")

        else:
            st.warning("Please enter some text")


if __name__ == "__main__":
    main()
