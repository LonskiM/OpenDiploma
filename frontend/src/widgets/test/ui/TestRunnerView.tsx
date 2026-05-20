import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getTestById,
    submitTest,
    type SubmitTestResponse,
    type TestData,
} from "@/features/test/api/testApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useTranslation } from "@/shared/lib/i18n";
import LoadingState from "@/shared/ui/LoadingState";

const TestRunnerView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [test, setTest] = useState<TestData | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [result, setResult] = useState<SubmitTestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        if (!test) {
            return false;
        }
        return test.questions.every((question) => selectedAnswers[question.id]);
    }, [selectedAnswers, test]);

    useEffect(() => {
        const loadTest = async () => {
            const testId = Number(id);
            if (!id || !Number.isInteger(testId) || testId <= 0) {
                setError(t("test.invalidId"));
                setLoading(false);
                return;
            }

            try {
                const data = await getTestById(testId);
                setTest(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, t("test.loadFailed")));
            } finally {
                setLoading(false);
            }
        };

        void loadTest();
    }, [id, t]);

    const onSubmit = async () => {
        if (!test) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const payload = test.questions.map((question) => ({
                questionId: question.id,
                answerId: selectedAnswers[question.id],
            }));
            const response = await submitTest(test.id, payload);
            setResult(response);
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, t("test.submitFailed")));
        } finally {
            setSubmitting(false);
        }
    };

    const questionsLabel =
        test && test.questions.length === 1
            ? t("test.questionOne")
            : t("test.questions", { count: test?.questions.length ?? 0 });

    if (loading) {
        return (
            <main className="page">
                <LoadingState message={t("test.loading")} />
            </main>
        );
    }

    if (error || !test) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? t("test.notFound")}</p>
                <Link to="/courses" className="btn-secondary">
                    {t("common.backToCourses")}
                </Link>
            </main>
        );
    }

    return (
        <main className="page">
            <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/courses">{t("courses.title")}</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{test.title}</span>
            </nav>

            <header className="page-header">
                <div>
                    <h1 className="page-title">{test.title}</h1>
                    <p className="page-subtitle">{questionsLabel}</p>
                </div>
            </header>

            {result ? (
                <section className="card score-result page-section">
                    <p className="score-big">
                        {result.score}/{result.total}
                    </p>
                    <p className="score-label">{t("test.yourScore")}</p>
                </section>
            ) : null}

            <section className="page-section" style={{ display: "grid", gap: "var(--sp-4)" }}>
                {test.questions.map((question, index) => (
                    <article className="question-card" key={question.id}>
                        <p className="question-number">
                            {t("test.questionOf", {
                                current: index + 1,
                                total: test.questions.length,
                            })}
                        </p>
                        <p className="question-text">{question.text}</p>
                        <div className="answer-list">
                            {question.answers.map((answer) => (
                                <label key={answer.id} className="answer-option">
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={answer.id}
                                        checked={selectedAnswers[question.id] === answer.id}
                                        onChange={() =>
                                            setSelectedAnswers((prev) => ({
                                                ...prev,
                                                [question.id]: answer.id,
                                            }))
                                        }
                                    />
                                    <span>{answer.text}</span>
                                </label>
                            ))}
                        </div>
                    </article>
                ))}
            </section>

            {error ? <p className="auth-error">{error}</p> : null}

            {!result ? (
                <div className="page-actions" style={{ marginTop: "var(--sp-4)" }}>
                    <button
                        type="button"
                        className="btn-primary"
                        disabled={!canSubmit || submitting}
                        onClick={onSubmit}
                    >
                        {submitting ? t("test.submitting") : t("test.submit")}
                    </button>
                </div>
            ) : null}
        </main>
    );
};

export default TestRunnerView;
