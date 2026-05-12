import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseById, type CourseDetails } from "@/features/course/api/courseApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

const CourseDetailsView = () => {
    const { id } = useParams();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCourse = async () => {
            const numericId = Number(id);
            if (!id || !Number.isInteger(numericId) || numericId <= 0) {
                setError("Invalid course id.");
                setLoading(false);
                return;
            }

            try {
                const data = await getCourseById(numericId);
                setCourse(data);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Failed to load course."));
            } finally {
                setLoading(false);
            }
        };

        void loadCourse();
    }, [id]);

    if (loading) {
        return <main className="page">Loading...</main>;
    }

    if (error || !course) {
        return (
            <main className="page">
                <p className="auth-error">{error ?? "Course not found."}</p>
                <Link to="/courses">Back to courses</Link>
            </main>
        );
    }

    return (
        <main className="page">
            <header className="page-header">
                <h1 className="page-title">{course.title}</h1>
                <Link to="/courses">Back to courses</Link>
            </header>
            <p>{course.description}</p>
            <p className="muted-text">Status: {course.status}</p>
            {course.teachers && course.teachers.length > 0 ? (
                <p className="muted-text">
                    Additional teachers: {course.teachers.map((teacher) => teacher.user.email).join(", ")}
                </p>
            ) : null}
            <h2>Lessons</h2>
            {course.lessons.length === 0 ? <p>No lessons yet.</p> : null}
            <section className="card-grid">
                {course.lessons.map((lesson, index) => (
                    <article key={lesson.id} className="card">
                        <h2>
                            Lesson #{index + 1}: {lesson.title}
                        </h2>
                        <Link to={`/lessons/${lesson.id}`}>Open lesson content</Link>
                        {lesson.tests?.map((test) => (
                            <Link key={test.id} to={`/tests/${test.id}`}>
                                Pass test: {test.title}
                            </Link>
                        ))}
                    </article>
                ))}
            </section>
        </main>
    );
};

export default CourseDetailsView;
