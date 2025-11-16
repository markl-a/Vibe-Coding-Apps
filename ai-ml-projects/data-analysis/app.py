"""
Streamlit UI for Data Analysis
"""
import streamlit as st
import pandas as pd
import numpy as np
from analyzer import DataAnalyzer
from predictor import Predictor
from visualizer import DataVisualizer
import io


def main():
    """Main Streamlit app"""
    st.set_page_config(
        page_title="Data Analysis & ML",
        page_icon="📊",
        layout="wide"
    )

    st.title("📊 Data Analysis & Machine Learning")
    st.markdown("Upload your dataset and perform analysis and modeling")

    # Sidebar
    with st.sidebar:
        st.header("Navigation")
        page = st.selectbox(
            "Choose a page",
            ["Upload Data", "Exploratory Analysis", "Visualization", "Modeling"]
        )

    # Initialize session state
    if 'df' not in st.session_state:
        st.session_state.df = None

    # Page routing
    if page == "Upload Data":
        upload_page()
    elif page == "Exploratory Analysis":
        eda_page()
    elif page == "Visualization":
        visualization_page()
    elif page == "Modeling":
        modeling_page()


def upload_page():
    """Data upload page"""
    st.header("Upload Dataset")

    uploaded_file = st.file_uploader(
        "Choose a CSV file",
        type=['csv']
    )

    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
            st.session_state.df = df

            st.success(f"Dataset loaded successfully! Shape: {df.shape}")

            st.subheader("Data Preview")
            st.dataframe(df.head(10))

            st.subheader("Column Types")
            st.write(df.dtypes)

        except Exception as e:
            st.error(f"Error loading file: {e}")

    else:
        st.info("Please upload a CSV file to get started")


def eda_page():
    """Exploratory Data Analysis page"""
    if st.session_state.df is None:
        st.warning("Please upload a dataset first")
        return

    st.header("Exploratory Data Analysis")

    df = st.session_state.df
    analyzer = DataAnalyzer(df)

    # Dataset info
    with st.expander("Dataset Information", expanded=True):
        info = analyzer.info()

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Rows", info['rows'])
        with col2:
            st.metric("Columns", info['columns'])
        with col3:
            st.metric("Memory", f"{info['memory_usage'] / 1024 / 1024:.2f} MB")

    # Descriptive statistics
    with st.expander("Descriptive Statistics"):
        st.dataframe(analyzer.describe())

    # Missing values
    with st.expander("Missing Values"):
        missing = analyzer.check_missing()
        if len(missing) > 0:
            st.dataframe(missing)

            # Visualize missing data
            import matplotlib.pyplot as plt
            import seaborn as sns

            fig, ax = plt.subplots(figsize=(10, 6))
            missing.plot(kind='barh', ax=ax)
            ax.set_xlabel('Count')
            ax.set_title('Missing Values by Column')
            st.pyplot(fig)
        else:
            st.success("No missing values found!")

    # Duplicates
    with st.expander("Duplicate Rows"):
        dup_info = analyzer.check_duplicates()
        st.write(f"**Duplicates:** {dup_info['duplicate_count']} ({dup_info['duplicate_percentage']:.2f}%)")

    # Correlation
    if len(analyzer.numeric_cols) > 1:
        with st.expander("Correlation Analysis"):
            threshold = st.slider("Correlation threshold", 0.0, 1.0, 0.7)
            corr = analyzer.correlation_analysis(threshold=threshold)
            st.dataframe(corr)


def visualization_page():
    """Visualization page"""
    if st.session_state.df is None:
        st.warning("Please upload a dataset first")
        return

    st.header("Data Visualization")

    df = st.session_state.df
    viz = DataVisualizer(df)

    viz_type = st.selectbox(
        "Choose visualization type",
        ["Distribution", "Correlation Heatmap", "Scatter Plot", "Box Plot", "Count Plot"]
    )

    if viz_type == "Distribution":
        column = st.selectbox("Select column", df.columns)
        if st.button("Generate Plot"):
            viz.plot_distribution(column)
            st.pyplot(plt.gcf())

    elif viz_type == "Correlation Heatmap":
        if len(viz.numeric_cols) > 0:
            if st.button("Generate Heatmap"):
                viz.plot_correlation_heatmap()
                st.pyplot(plt.gcf())
        else:
            st.warning("No numeric columns found")

    elif viz_type == "Scatter Plot":
        col1, col2 = st.columns(2)
        with col1:
            x_col = st.selectbox("X-axis", viz.numeric_cols)
        with col2:
            y_col = st.selectbox("Y-axis", viz.numeric_cols)

        hue_col = st.selectbox("Color by (optional)", [None] + df.columns.tolist())

        if st.button("Generate Plot"):
            viz.scatter_plot(x_col, y_col, hue=hue_col)
            st.pyplot(plt.gcf())

    elif viz_type == "Box Plot":
        columns = st.multiselect("Select columns", viz.numeric_cols, default=viz.numeric_cols[:3])
        if st.button("Generate Plot"):
            viz.box_plot(columns)
            st.pyplot(plt.gcf())

    elif viz_type == "Count Plot":
        column = st.selectbox("Select column", viz.categorical_cols)
        top_n = st.slider("Top N categories", 5, 20, 10)
        if st.button("Generate Plot"):
            viz.count_plot(column, top_n=top_n)
            st.pyplot(plt.gcf())


def modeling_page():
    """Machine Learning modeling page"""
    if st.session_state.df is None:
        st.warning("Please upload a dataset first")
        return

    st.header("Machine Learning Modeling")

    df = st.session_state.df

    # Task selection
    task = st.selectbox("Task Type", ["classification", "regression"])

    # Feature and target selection
    target = st.selectbox("Target Variable", df.columns)
    features = st.multiselect(
        "Features",
        [col for col in df.columns if col != target],
        default=[col for col in df.columns if col != target][:5]
    )

    if len(features) == 0:
        st.warning("Please select at least one feature")
        return

    # Model configuration
    col1, col2 = st.columns(2)

    with col1:
        if task == "classification":
            model_type = st.selectbox("Model Type", ["logistic", "random_forest", "svm"])
        else:
            model_type = st.selectbox("Model Type", ["linear", "random_forest", "svm"])

    with col2:
        test_size = st.slider("Test Size", 0.1, 0.5, 0.2)

    cv_folds = st.slider("Cross-Validation Folds", 0, 10, 5)

    if st.button("Train Model"):
        with st.spinner("Training model..."):
            try:
                # Prepare data
                X = df[features].select_dtypes(include=[np.number])
                y = df[target]

                # Handle missing values
                X = X.fillna(X.mean())

                # Split data
                from sklearn.model_selection import train_test_split
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42
                )

                # Train model
                predictor = Predictor(task=task)
                train_metrics = predictor.train(
                    X_train, y_train,
                    model_type=model_type,
                    cv=cv_folds if cv_folds > 0 else None
                )

                # Evaluate
                test_metrics = predictor.evaluate(X_test, y_test)

                # Display results
                st.success("Model trained successfully!")

                col1, col2 = st.columns(2)

                with col1:
                    st.subheader("Training Metrics")
                    st.json(train_metrics)

                with col2:
                    st.subheader("Test Metrics")
                    st.json(test_metrics)

                # Feature importance
                try:
                    st.subheader("Feature Importance")
                    importance = predictor.feature_importance()
                    st.dataframe(importance)

                    import matplotlib.pyplot as plt
                    fig, ax = plt.subplots(figsize=(10, 6))
                    importance.plot(kind='barh', x='feature', y='importance', ax=ax)
                    ax.set_xlabel('Importance')
                    st.pyplot(fig)
                except:
                    pass

                # Confusion matrix for classification
                if task == "classification" and 'confusion_matrix' in test_metrics:
                    st.subheader("Confusion Matrix")
                    cm = np.array(test_metrics['confusion_matrix'])

                    import seaborn as sns
                    fig, ax = plt.subplots(figsize=(8, 6))
                    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
                    ax.set_xlabel('Predicted')
                    ax.set_ylabel('Actual')
                    st.pyplot(fig)

            except Exception as e:
                st.error(f"Error: {e}")
                import traceback
                st.code(traceback.format_exc())


if __name__ == "__main__":
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import matplotlib.pyplot as plt

    main()
