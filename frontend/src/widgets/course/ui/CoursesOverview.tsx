import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import { type Course, getCourses } from "@/features/course/api/courseApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { isTeacherRole } from "@/shared/lib/roles";
import { useTranslation } from "@/shared/lib/i18n";
import { StatusChip } from "@/shared/ui/Chip";
import LoadingState from "@/shared/ui/LoadingState";

const CoursesOverview = () => {
    const { t } = useTranslation();
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchTitle, setSearchTitle] = useState("");
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setError(null);
                const data = await getCourses();
                setCourses(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, t("courses.loadFailed")));
            } finally {
                setLoading(false);
            }
        };

        void loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const normalizedTitleQuery = searchTitle.trim().toLowerCase();
    const normalizedIdQuery = searchId.trim();
    const filteredCourses = courses.filter((course) => {
        const canSeeCourse = isTeacherRole(user?.roleId) || course.status === "APPROVED";
        if (!canSeeCourse) {
            return false;
        }
        const byTitle =
            normalizedTitleQuery.length === 0 ||
            course.title.toLowerCase().includes(normalizedTitleQuery);
        const byId =
            normalizedIdQuery.length === 0 ||
            String(course.id).includes(normalizedIdQuery);
        return byTitle && byId;
    });

    return (
        <main className="page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t("courses.title")}</h1>
                    <p className="page-subtitle">{t("courses.subtitle")}</p>
                </div>
            </header>

            <section className="page-section">
                <div className="search-bar card">
                    <div className="search-input-wrap">
                        <span className="search-icon" aria-hidden>
                            ⌕
                        </span>
                        <input
                            value={searchTitle}
                            onChange={(event) => setSearchTitle(event.target.value)}
                            placeholder={t("courses.searchTitle")}
                            aria-label={t("courses.searchTitle")}
                        />
                    </div>
                    <div className="search-input-wrap">
                        <span className="search-icon" aria-hidden>
                            #
                        </span>
                        <input
                            value={searchId}
                            onChange={(event) => setSearchId(event.target.value)}
                            placeholder={t("courses.searchId")}
                            aria-label={t("courses.searchId")}
                        />
                    </div>
                </div>
            </section>

            {loading ? <LoadingState message={t("courses.loading")} /> : null}
            {error ? <p className="auth-error">{error}</p> : null}

            {!loading && !error && filteredCourses.length === 0 ? (
                <div className="empty">
                    <p className="empty-title">{t("courses.emptyTitle")}</p>
                    <p className="empty-desc">{t("courses.emptyDesc")}</p>
                </div>
            ) : null}

            <section className="card-grid">
                {filteredCourses.map((course) => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="course-card">
                        <div className="course-card-thumb">
                            <span className="course-card-thumb-text">
                                {course.title.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="course-card-body">
                            <div className="inline-row">
                                <StatusChip status={course.status} />
                                <span className="course-card-meta">#{course.id}</span>
                            </div>
                            <h2 className="course-card-title">{course.title}</h2>
                            <p className="course-card-desc">{course.description}</p>
                        </div>
                        <footer className="course-card-footer">
                            <span className="text-muted">
                                {course.author?.name ?? course.author?.email ?? t("common.unknown")}
                            </span>
                            <span className="text-muted">{t("courses.openCourse")} →</span>
                        </footer>
                    </Link>
                ))}
            </section>
        </main>
    );
};

export default CoursesOverview;
