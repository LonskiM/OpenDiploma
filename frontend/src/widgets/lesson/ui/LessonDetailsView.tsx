import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLessonById, type LessonDetails } from "@/features/course/api/courseApi";
import { completeLesson } from "@/features/progress/api/progressApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useTranslation } from "@/shared/lib/i18n";
import LoadingState from "@/shared/ui/LoadingState";

const LessonDetailsView = () => {
    const { t } = useTranslation();
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
                setError(t("lesson.invalidId"));
                setLoading(false);
                return;
            }

            try {
                const data = await getLessonById(lessonId);
                setLesson(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, t("lesson.loadFailed")));
            } finally {
                setLoading(false);
            }
        };

        void loadLesson();
    }, [id, t]);

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
                setCompleteMessage(t("lesson.completed"));
            }
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, t("lesson.completeFailed")));
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) {
        return (
            <main className="page">
                <LoadingState message={t("lesson.loading")} />
            </main>
        );
    }

    if (error || !lesson) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? t("lesson.notFound")}</p>
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
                <Link to={`/courses/${lesson.courseId}`}>{t("common.backToCourse")}</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{lesson.title}</span>
            </nav>

            <header className="page-header">
                <div>
                    <h1 className="page-title">{lesson.title}</h1>
                    <p className="page-subtitle">{t("lesson.subtitle")}</p>
                </div>
            </header>

            <section className="card page-section">
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{lesson.content}</p>
            </section>

            <section className="card page-section">
                <h2 className="page-section-title" style={{ border: "none", margin: 0, padding: 0 }}>
                    {t("lesson.progress")}
                </h2>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={onCompleteLesson}
                    disabled={isCompleting}
                >
                    {isCompleting ? t("lesson.saving") : t("lesson.markComplete")}
                </button>
                {completeMessage ? <p className="alert-success">{completeMessage}</p> : null}
                {error ? <p className="auth-error">{error}</p> : null}
            </section>

            <section className="page-section">
                <h2 className="page-section-title">{t("lesson.tests")}</h2>
                {lesson.tests.length === 0 ? (
                    <div className="empty">
                        <p className="empty-title">{t("lesson.noTests")}</p>
                        <p className="empty-desc">{t("lesson.noTestsDesc")}</p>
                    </div>
                ) : (
                    <div className="lesson-list">
                        {lesson.tests.map((test) => (
                            <Link
                                key={test.id}
                                to={`/tests/${test.id}`}
                                className="lesson-item"
                            >
                                <span className="lesson-number">T</span>
                                <div className="lesson-info">
                                    <p className="lesson-title">{test.title}</p>
                                    <p className="lesson-meta">{t("lesson.startTest")}</p>
                                </div>
                                <span className="text-muted">→</span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default LessonDetailsView;
