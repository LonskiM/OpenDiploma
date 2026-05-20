import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseById, type CourseDetails } from "@/features/course/api/courseApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useTranslation } from "@/shared/lib/i18n";
import { StatusChip } from "@/shared/ui/Chip";
import LoadingState from "@/shared/ui/LoadingState";

const CourseDetailsView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCourse = async () => {
            const numericId = Number(id);
            if (!id || !Number.isInteger(numericId) || numericId <= 0) {
                setError(t("courses.invalidId"));
                setLoading(false);
                return;
            }

            try {
                const data = await getCourseById(numericId);
                setCourse(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, t("courses.loadOneFailed")));
            } finally {
                setLoading(false);
            }
        };

        void loadCourse();
    }, [id, t]);

    if (loading) {
        return (
            <main className="page">
                <LoadingState message={t("courses.loadingOne")} />
            </main>
        );
    }

    if (error || !course) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? t("courses.notFound")}</p>
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
                <span className="breadcrumb-current">{course.title}</span>
            </nav>

            <header className="page-header">
                <div>
                    <h1 className="page-title">{course.title}</h1>
                    <p className="page-subtitle">{course.description}</p>
                </div>
                <div className="page-actions">
                    <StatusChip status={course.status} />
                </div>
            </header>

            {course.teachers && course.teachers.length > 0 ? (
                <p className="text-muted page-section">
                    {t("courses.additionalTeachers")}:{" "}
                    {course.teachers.map((teacher) => teacher.user.email).join(", ")}
                </p>
            ) : null}

            <section className="page-section">
                <h2 className="page-section-title">{t("courses.lessons")}</h2>
                {course.lessons.length === 0 ? (
                    <div className="empty">
                        <p className="empty-title">{t("courses.noLessons")}</p>
                        <p className="empty-desc">{t("courses.noLessonsDesc")}</p>
                    </div>
                ) : (
                    <div className="lesson-list">
                        {course.lessons.map((lesson, index) => (
                            <article key={lesson.id} className="lesson-item">
                                <span className="lesson-number">{index + 1}</span>
                                <div className="lesson-info">
                                    <p className="lesson-title">{lesson.title}</p>
                                    <p className="lesson-meta">
                                        {lesson.tests?.length
                                            ? t("courses.lessonMetaTests", {
                                                  count: lesson.tests.length,
                                              })
                                            : t("courses.lessonMetaNoTests")}
                                    </p>
                                </div>
                                <div className="lesson-tests">
                                    <Link
                                        to={`/lessons/${lesson.id}`}
                                        className="btn-secondary"
                                    >
                                        {t("courses.openLesson")}
                                    </Link>
                                    {lesson.tests?.map((test) => (
                                        <Link
                                            key={test.id}
                                            to={`/tests/${test.id}`}
                                            className="ghost-button"
                                        >
                                            {test.title}
                                        </Link>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default CourseDetailsView;
