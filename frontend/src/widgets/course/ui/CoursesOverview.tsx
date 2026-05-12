import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import { logout } from "@/features/auth/model/authSlice";
import { type Course, getCourses } from "@/features/course/api/courseApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { isTeacherRole } from "@/shared/lib/roles";

const CoursesOverview = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchTitle, setSearchTitle] = useState("");
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setError(null);
                const data = await getCourses();
                setCourses(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Failed to load courses."));
            } finally {
                setLoading(false);
            }
        };

        void loadCourses();
    }, []);

    const onLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };

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
                <h1 className="page-title">Courses</h1>
                <div className="page-actions">
                    <Link to="/profile">Profile</Link>
                    <button type="button" className="ghost-button" onClick={onLogout}>
                        Sign out
                    </button>
                </div>
            </header>
            <p className="muted-text">Signed in as {user?.email ?? "Unknown user"}</p>
            <section className="card search-card">
                <h2>Search courses</h2>
                <input
                    value={searchTitle}
                    onChange={(event) => setSearchTitle(event.target.value)}
                    placeholder="Search by title"
                />
                <input
                    value={searchId}
                    onChange={(event) => setSearchId(event.target.value)}
                    placeholder="Search by course ID"
                />
            </section>
            {loading ? <p>Loading...</p> : null}
            {error ? <p className="auth-error">{error}</p> : null}
            <section className="card-grid">
                {filteredCourses.map((course) => (
                    <article key={course.id} className="card">
                        <h2>{course.title}</h2>
                        <p className="muted-text">Course ID: {course.id}</p>
                        <p>{course.description}</p>
                        <p className="muted-text">Status: {course.status}</p>
                        <p className="muted-text">
                            Author: {course.author?.name ?? course.author?.email ?? "Unknown"}
                        </p>
                        <Link to={`/courses/${course.id}`}>Open course</Link>
                    </article>
                ))}
            </section>
        </main>
    );
};

export default CoursesOverview;
