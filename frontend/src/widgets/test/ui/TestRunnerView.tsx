import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getTestById,
    submitTest,
    type SubmitTestResponse,
    type TestData,
} from "@/features/test/api/testApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

const TestRunnerView = () => {
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
                setError("Invalid test id.");
                setLoading(false);
                return;
            }

            try {
                const data = await getTestById(testId);
                setTest(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Failed to load test."));
            } finally {
                setLoading(false);
            }
        };

        void loadTest();
    }, [id]);

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
            setError(getApiErrorMessage(submitError, "Failed to submit test."));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <main className="page">Loading...</main>;
    }

    if (error || !test) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? "Test not found."}</p>
                <Link to="/courses">Back to courses</Link>
            </main>
        );
    }

    return (
        <main className="page">
            <header className="page-header">
                <h1 className="page-title">{test.title}</h1>
                <Link to="/courses">Back to courses</Link>
            </header>

            {result ? (
                <section className="card">
                    <h2>Result</h2>
                    <p>
                        Score: {result.score} / {result.total}
                    </p>
                </section>
            ) : null}

            <section className="card-grid">
                {test.questions.map((question) => (
                    <article className="card" key={question.id}>
                        <h2>{question.text}</h2>
                        <div className="answers-list">
                            {question.answers.map((answer) => (
                                <label key={answer.id} className="answer-item">
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
            <button type="button" disabled={!canSubmit || submitting} onClick={onSubmit}>
                {submitting ? "Submitting..." : "Submit test"}
            </button>
        </main>
    );
};

export default TestRunnerView;
