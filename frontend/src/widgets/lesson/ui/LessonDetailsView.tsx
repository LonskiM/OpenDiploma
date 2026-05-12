import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLessonById, type LessonDetails } from "@/features/course/api/courseApi";
import { completeLesson } from "@/features/progress/api/progressApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

const LessonDetailsView = () => {
    const { id } = useParams();
    const [lesson, setLesson] = useState<LessonDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [completeMessage, setCompleteMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadLesson = async () => {
            const lessonId = Number(id);
            if (!id || !Number.isInteger(lessonId) || lessonId <= 0) {
                setError("Invalid lesson id.");
                setLoading(false);
                return;
            }

            try {
                const data = await getLessonById(lessonId);
                setLesson(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Failed to load lesson."));
            } finally {
                setLoading(false);
            }
        };

        void loadLesson();
    }, [id]);

    const onCompleteLesson = async () => {
        if (!lesson) {
            return;
        }

        setIsCompleting(true);
        setError(null);
        setCompleteMessage(null);
        try {
            const data = await completeLesson(lesson.id);
            if (typeof data?.message === "string") {
                setCompleteMessage(data.message);
            } else {
                setCompleteMessage("Lesson marked as completed.");
            }
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Failed to update lesson progress."));
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) {
        return <main className="page">Loading lesson...</main>;
    }

    if (error || !lesson) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? "Lesson not found."}</p>
                <Link to="/courses">Back to courses</Link>
            </main>
        );
    }

    return (
        <main className="page">
            <header className="page-header">
                <h1 className="page-title">{lesson.title}</h1>
                <Link to={`/courses/${lesson.courseId}`}>Back to course</Link>
            </header>

            <section className="card">
                <p>{lesson.content}</p>
            </section>

            <section className="card">
                <h2>Actions</h2>
                <button type="button" onClick={onCompleteLesson} disabled={isCompleting}>
                    {isCompleting ? "Saving..." : "Mark lesson as completed"}
                </button>
                {completeMessage ? <p>{completeMessage}</p> : null}
            </section>

            <section className="card">
                <h2>Tests for this lesson</h2>
                {lesson.tests.length === 0 ? <p>No tests yet.</p> : null}
                {lesson.tests.map((test) => (
                    <p key={test.id}>
                        <Link to={`/tests/${test.id}`}>Start test: {test.title}</Link>
                    </p>
                ))}
            </section>
        </main>
    );
};

export default LessonDetailsView;
