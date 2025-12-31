import { useState, useEffect } from 'react';
import { useCourseStore, BADGES } from './store';
import { sampleCourse } from './sample-course';
import type { Lesson, QuizContent, QuizQuestion, TextContent, CodeContent, LessonContent } from './types';

export default function App() {
  const store = useCourseStore();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  // Initialize course
  useEffect(() => {
    if (!store.currentCourseId) {
      useCourseStore.setState({ courses: [sampleCourse] });
      store.setCourse(sampleCourse.id);
    }
  }, []);

  // Set first lesson
  useEffect(() => {
    if (!currentLesson && sampleCourse.modules[0]?.lessons[0]) {
      const firstLesson = sampleCourse.modules[0].lessons[0];
      setCurrentLesson(firstLesson);
      store.setLesson(firstLesson.id);
    }
  }, [currentLesson]);

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    store.setLesson(lesson.id);
    setQuizAnswers({});
    setQuizSubmitted({});
    setShowResults({});
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (quizSubmitted[questionId]) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFillAnswer = (questionId: string, answer: string) => {
    if (quizSubmitted[questionId]) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitQuestion = (question: QuizQuestion) => {
    setQuizSubmitted((prev) => ({ ...prev, [question.id]: true }));
    setShowResults((prev) => ({ ...prev, [question.id]: true }));
  };

  const submitQuiz = (quiz: QuizContent) => {
    let score = 0;
    let maxScore = 0;

    quiz.data.questions.forEach((q) => {
      maxScore += q.points;
      const answer = quizAnswers[q.id];

      if (q.type === 'fill_blank') {
        if (answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) {
          score += q.points;
        }
      } else {
        const correctOption = q.options?.find((o) => o.isCorrect);
        if (answer === correctOption?.id) {
          score += q.points;
        }
      }

      setQuizSubmitted((prev) => ({ ...prev, [q.id]: true }));
      setShowResults((prev) => ({ ...prev, [q.id]: true }));
    });

    store.submitQuiz(quiz.id, quizAnswers, score, maxScore);
  };

  const completeLesson = () => {
    if (currentLesson) {
      store.completeLesson(currentLesson.id);
    }
  };

  const getNextLesson = (): Lesson | null => {
    if (!currentLesson) return null;

    let foundCurrent = false;
    for (const mod of sampleCourse.modules) {
      for (const lesson of mod.lessons) {
        if (foundCurrent) return lesson;
        if (lesson.id === currentLesson.id) foundCurrent = true;
      }
    }
    return null;
  };

  const getPrevLesson = (): Lesson | null => {
    if (!currentLesson) return null;

    let prevLesson: Lesson | null = null;
    for (const mod of sampleCourse.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === currentLesson.id) return prevLesson;
        prevLesson = lesson;
      }
    }
    return null;
  };

  const progress = store.getCourseProgress(sampleCourse.id);
  const earnedBadgeIds = store.earnedBadges;
  const earnedBadges = BADGES.filter((b) => earnedBadgeIds.includes(b.id));

  const renderContent = (content: LessonContent) => {
    switch (content.type) {
      case 'text':
        return (
          <div key={content.id} className="text-content">
            {(content as TextContent).data.text.split('\n').map((line: string, i: number) => {
              if (line.startsWith('# ')) {
                return <h1 key={i}>{line.slice(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i}>{line.slice(3)}</h2>;
              }
              if (line.startsWith('- ')) {
                return <li key={i}>{line.slice(2)}</li>;
              }
              if (line.trim() === '') {
                return <br key={i} />;
              }
              return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>')}</p>;
            })}
          </div>
        );

      case 'code':
        return (
          <div key={content.id} className="code-block">
            <code>{(content as CodeContent).data.code}</code>
          </div>
        );

      case 'quiz':
        const quiz = content as QuizContent;
        const allAnswered = quiz.data.questions.every((q) => quizAnswers[q.id]);
        const allSubmitted = quiz.data.questions.every((q) => quizSubmitted[q.id]);

        let quizScore = 0;
        let quizMaxScore = 0;
        if (allSubmitted) {
          quiz.data.questions.forEach((q) => {
            quizMaxScore += q.points;
            const answer = quizAnswers[q.id];
            if (q.type === 'fill_blank') {
              if (answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) {
                quizScore += q.points;
              }
            } else {
              const correctOption = q.options?.find((o) => o.isCorrect);
              if (answer === correctOption?.id) {
                quizScore += q.points;
              }
            }
          });
        }

        return (
          <div key={content.id} className="quiz-container">
            <h3>{quiz.data.title}</h3>

            {quiz.data.questions.map((question, qIndex) => {
              const isSubmitted = quizSubmitted[question.id];
              const showResult = showResults[question.id];
              const selectedAnswer = quizAnswers[question.id];

              let isCorrect = false;
              if (question.type === 'fill_blank') {
                isCorrect = selectedAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
              } else {
                const correctOption = question.options?.find((o) => o.isCorrect);
                isCorrect = selectedAnswer === correctOption?.id;
              }

              return (
                <div key={question.id} className="question">
                  <p className="question-text">
                    {qIndex + 1}. {question.question}
                  </p>

                  {question.type === 'fill_blank' ? (
                    <input
                      type="text"
                      className="fill-input"
                      placeholder="Type your answer..."
                      value={quizAnswers[question.id] || ''}
                      onChange={(e) => handleFillAnswer(question.id, e.target.value)}
                      disabled={isSubmitted}
                      style={{
                        borderColor: showResult
                          ? isCorrect
                            ? '#40c057'
                            : '#fa5252'
                          : undefined,
                      }}
                    />
                  ) : (
                    <div className="options">
                      {question.options?.map((option) => {
                        const isSelected = selectedAnswer === option.id;
                        let className = 'option';
                        if (isSelected) className += ' selected';
                        if (showResult) {
                          if (option.isCorrect) className += ' correct';
                          else if (isSelected) className += ' incorrect';
                        }

                        return (
                          <div
                            key={option.id}
                            className={className}
                            onClick={() => handleOptionSelect(question.id, option.id)}
                          >
                            <span>{option.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showResult && question.explanation && (
                    <div className="explanation">
                      {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}
                      {question.explanation}
                    </div>
                  )}

                  {!isSubmitted && selectedAnswer && (
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: '12px' }}
                      onClick={() => submitQuestion(question)}
                    >
                      Check Answer
                    </button>
                  )}
                </div>
              );
            })}

            {!allSubmitted && allAnswered && (
              <button className="btn btn-primary" onClick={() => submitQuiz(quiz)}>
                Submit All Answers
              </button>
            )}

            {allSubmitted && (
              <div className="quiz-result">
                <p>Quiz Complete!</p>
                <p className={`quiz-score ${quizScore >= quizMaxScore * 0.7 ? 'passed' : 'failed'}`}>
                  {quizScore} / {quizMaxScore}
                </p>
                <p>{quizScore >= quizMaxScore * 0.7 ? '🎉 Great job!' : 'Keep practicing!'}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>{sampleCourse.title}</h2>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress?.overallProgress || 0}%` }}
          />
        </div>
        <p style={{ fontSize: '0.85rem', marginTop: '8px', color: '#888' }}>
          {Math.round(progress?.overallProgress || 0)}% complete
        </p>

        <ul className="module-list">
          {sampleCourse.modules.map((mod) => (
            <li key={mod.id}>
              <p className="module-title">{mod.title}</p>
              {mod.lessons.map((lesson) => {
                const lessonProgress = store.getLessonProgress(sampleCourse.id, lesson.id);
                const isActive = currentLesson?.id === lesson.id;
                const isCompleted = lessonProgress?.completed;

                return (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => selectLesson(lesson)}
                  >
                    <span className={`lesson-check ${isCompleted ? 'done' : ''}`}>
                      {isCompleted ? '✓' : ''}
                    </span>
                    <span>{lesson.title}</span>
                  </div>
                );
              })}
            </li>
          ))}
        </ul>

        {earnedBadges.length > 0 && (
          <div className="badges">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="badge" title={badge.description}>
                <span className="badge-icon">{badge.icon}</span>
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{store.totalPoints}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">{earnedBadges.length}</span>
            <span className="stat-label">Badges</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📚</span>
            <span className="stat-value">
              {Object.values(progress?.completedLessons || {}).filter((l) => l.completed).length}
            </span>
            <span className="stat-label">Lessons</span>
          </div>
        </div>

        {/* Lesson content */}
        {currentLesson && (
          <div className="content-card">
            <h1>{currentLesson.title}</h1>
            <p>{currentLesson.description}</p>

            {currentLesson.content.map(renderContent)}

            <div className="lesson-nav">
              <button
                className="nav-btn"
                onClick={() => {
                  const prev = getPrevLesson();
                  if (prev) selectLesson(prev);
                }}
                disabled={!getPrevLesson()}
              >
                ← Previous
              </button>

              {!store.getLessonProgress(sampleCourse.id, currentLesson.id)?.completed ? (
                <button className="btn btn-success" onClick={completeLesson}>
                  ✓ Mark as Complete
                </button>
              ) : (
                <span style={{ color: '#40c057', fontWeight: 500 }}>✓ Completed</span>
              )}

              <button
                className="nav-btn"
                onClick={() => {
                  const next = getNextLesson();
                  if (next) selectLesson(next);
                }}
                disabled={!getNextLesson()}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
