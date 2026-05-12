import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import { logout, setUser } from "@/features/auth/model/authSlice";
import { updateMyAvatar } from "@/features/auth/api/authApi";
import {
    getMyProgress,
    type ProfileProgressResponse,
    type TestAttemptItem,
} from "@/features/progress/api/progressApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import {
    addTeacherToCourse,
    createCourse,
    createLesson,
    deleteCourse,
    deleteLesson,
    getCourseTestAttempts,
    getCourses,
    getLessonsByCourse,
    updateCourse,
    type Course,
    type CourseTestAttempt,
    type Lesson,
} from "@/features/course/api/courseApi";
import { createTest, deleteTest } from "@/features/test/api/testApi";
import {
    getPendingCourses,
    getUsers,
    moderateCourse,
    updateUserRole,
    type AdminUser,
} from "@/features/admin/api/adminApi";
import { AvatarUploader } from "@/features/profile";
import CollapsibleSection from "@/shared/ui/CollapsibleSection";
import { isAdminRole, isTeacherRole, ROLE_IDS } from "@/shared/lib/roles";

interface TestDraftQuestion {
    text: string;
    answers: string[];
    correctAnswerIndex: number;
}

const createEmptyQuestion = (): TestDraftQuestion => ({
    text: "",
    answers: ["", ""],
    correctAnswerIndex: 0,
});

const ProfileDashboard = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [progress, setProgress] = useState<ProfileProgressResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
    const [teacherError, setTeacherError] = useState<string | null>(null);
    const [teacherMessage, setTeacherMessage] = useState<string | null>(null);
    const [newCourseTitle, setNewCourseTitle] = useState("");
    const [newCourseDescription, setNewCourseDescription] = useState("");
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonContent, setNewLessonContent] = useState("");
    const [newLessonOrder, setNewLessonOrder] = useState("0");
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [courseEditTitle, setCourseEditTitle] = useState("");
    const [courseEditDescription, setCourseEditDescription] = useState("");
    const [teacherToAssign, setTeacherToAssign] = useState("");
    const [courseAttempts, setCourseAttempts] = useState<CourseTestAttempt[]>([]);
    const [newTestTitle, setNewTestTitle] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
    const [selectedLessonTestId, setSelectedLessonTestId] = useState<number | null>(null);
    const [questions, setQuestions] = useState<TestDraftQuestion[]>([createEmptyQuestion()]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [adminError, setAdminError] = useState<string | null>(null);
    const [adminMessage, setAdminMessage] = useState<string | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isTeacher = isTeacherRole(user?.roleId);
    const isAdmin = isAdminRole(user?.roleId);

    const reloadManageableCourses = async () => {
        if (!user?.id) {
            return;
        }
        const data = await getCourses();
        const manageableCourses = data.filter((course) => {
            const isAuthor = course.authorId === user.id;
            const isAssignedTeacher = (course.teachers ?? []).some(
                (teacherRelation) => teacherRelation.userId === user.id
            );
            return isAdmin || isAuthor || isAssignedTeacher;
        });
        setCourses(manageableCourses);
        if (manageableCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(manageableCourses[0].id);
        }
    };

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const data = await getMyProgress();
                setProgress(data);
                if (data.testAttempts.length > 0) {
                    setSelectedTestId(data.testAttempts[0].test.id);
                }
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Failed to load profile progress."));
            } finally {
                setLoading(false);
            }
        };

        void loadProgress();
    }, []);

    useEffect(() => {
        const loadCourses = async () => {
            if (!isTeacher || !user?.id) {
                return;
            }

            try {
                await reloadManageableCourses();
            } catch (loadError) {
                setTeacherError(getApiErrorMessage(loadError, "Failed to load teacher courses."));
            }
        };

        void loadCourses();
    }, [isTeacher, user?.id, isAdmin]);

    useEffect(() => {
        const loadAdminData = async () => {
            if (!isAdmin) {
                return;
            }

            try {
                const [usersData, pendingData] = await Promise.all([getUsers(), getPendingCourses()]);
                setAdminUsers(usersData);
                setPendingCourses(pendingData);
            } catch (loadError) {
                setAdminError(getApiErrorMessage(loadError, "Failed to load admin panel data."));
            }
        };

        void loadAdminData();
    }, [isAdmin]);

    useEffect(() => {
        const loadLessons = async () => {
            if (!selectedCourseId) {
                setTeacherLessons([]);
                setSelectedLessonId(null);
                return;
            }
            try {
                const data = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(data);
                if (data.length > 0) {
                    setSelectedLessonId(data[0].id);
                } else {
                    setSelectedLessonId(null);
                }
            } catch (loadError) {
                setTeacherError(getApiErrorMessage(loadError, "Failed to load course lessons."));
            }
        };

        void loadLessons();
    }, [selectedCourseId]);

    useEffect(() => {
        const selectedCourse = courses.find((item) => item.id === selectedCourseId);
        if (!selectedCourse) {
            return;
        }

        setCourseEditTitle(selectedCourse.title);
        setCourseEditDescription(selectedCourse.description);
    }, [courses, selectedCourseId]);

    useEffect(() => {
        const loadAttempts = async () => {
            if (!selectedCourseId) {
                setCourseAttempts([]);
                return;
            }

            try {
                const attempts = await getCourseTestAttempts(selectedCourseId);
                setCourseAttempts(attempts);
            } catch (loadError) {
                setTeacherError(getApiErrorMessage(loadError, "Failed to load course test attempts."));
            }
        };

        void loadAttempts();
    }, [selectedCourseId]);

    useEffect(() => {
        const selectedLesson = teacherLessons.find((lesson) => lesson.id === selectedLessonId);
        if (!selectedLesson?.tests?.length) {
            setSelectedLessonTestId(null);
            return;
        }
        setSelectedLessonTestId(selectedLesson.tests[0].id);
    }, [teacherLessons, selectedLessonId]);

    const onLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };

    const onAvatarUpload = async (avatarUrl: string) => {
        try {
            const updatedUser = await updateMyAvatar(avatarUrl);
            dispatch(setUser(updatedUser));
        } catch (uploadError) {
            throw new Error(getApiErrorMessage(uploadError, "Failed to upload avatar."));
        }
    };

    const onCreateCourse = async () => {
        try {
            setTeacherError(null);
            const course = await createCourse(newCourseTitle.trim(), newCourseDescription.trim());
            setCourses((prev) => [...prev, course]);
            setSelectedCourseId(course.id);
            setTeacherMessage("Course created.");
            setNewCourseTitle("");
            setNewCourseDescription("");
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to create course."));
        }
    };

    const onUpdateCourse = async () => {
        if (!selectedCourseId) {
            setTeacherError("Select course first.");
            return;
        }
        try {
            setTeacherError(null);
            await updateCourse(selectedCourseId, courseEditTitle.trim(), courseEditDescription.trim());
            await reloadManageableCourses();
            setTeacherMessage("Course updated.");
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to update course."));
        }
    };

    const onAddTeacher = async () => {
        if (!selectedCourseId) {
            setTeacherError("Select course first.");
            return;
        }

        const teacherUserId = Number(teacherToAssign);
        if (!Number.isInteger(teacherUserId) || teacherUserId <= 0) {
            setTeacherError("Enter valid teacher user ID.");
            return;
        }

        try {
            setTeacherError(null);
            await addTeacherToCourse(selectedCourseId, teacherUserId);
            setTeacherToAssign("");
            setTeacherMessage("Teacher added to course.");
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to add teacher to course."));
        }
    };

    const onCreateLesson = async () => {
        if (!selectedCourseId) {
            setTeacherError("Select course first.");
            return;
        }
        try {
            setTeacherError(null);
            const lesson = await createLesson({
                title: newLessonTitle.trim(),
                content: newLessonContent.trim(),
                courseId: selectedCourseId,
                orderIndex: Number(newLessonOrder),
            });
            setTeacherLessons((prev) => [...prev, lesson]);
            setSelectedLessonId(lesson.id);
            setTeacherMessage("Lesson created.");
            setNewLessonTitle("");
            setNewLessonContent("");
            setNewLessonOrder("0");
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to create lesson."));
        }
    };

    const onDeleteCourse = async () => {
        if (!selectedCourseId) {
            setTeacherError("Select course first.");
            return;
        }
        try {
            setTeacherError(null);
            await deleteCourse(selectedCourseId);
            setTeacherMessage("Course deleted.");
            setSelectedCourseId(null);
            setSelectedLessonId(null);
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to delete course."));
        }
    };

    const onDeleteLesson = async () => {
        if (!selectedLessonId) {
            setTeacherError("Select lesson first.");
            return;
        }
        try {
            setTeacherError(null);
            await deleteLesson(selectedLessonId);
            setTeacherMessage("Lesson deleted.");
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
                setSelectedLessonId(lessons[0]?.id ?? null);
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to delete lesson."));
        }
    };

    const onCreateTest = async () => {
        if (!selectedLessonId) {
            setTeacherError("Select lesson first.");
            return;
        }

        const normalizedQuestions = questions
            .map((question) => {
                const answers = question.answers.map((answer) => answer.trim()).filter(Boolean);
                return {
                    text: question.text.trim(),
                    answers,
                    correctAnswerIndex: question.correctAnswerIndex,
                };
            })
            .filter((question) => question.text.length > 0);

        if (normalizedQuestions.length === 0) {
            setTeacherError("Add at least one valid question.");
            return;
        }

        if (
            normalizedQuestions.some(
                (question) => question.answers.length < 2 || question.correctAnswerIndex >= question.answers.length
            )
        ) {
            setTeacherError("Each question needs at least 2 answers and valid correct answer.");
            return;
        }

        try {
            setTeacherError(null);
            await createTest({
                lessonId: selectedLessonId,
                title: newTestTitle.trim(),
                questions: normalizedQuestions.map((question) => ({
                    text: question.text,
                    type: "single",
                    answers: question.answers.map((answer, index) => ({
                        text: answer,
                        isCorrect: index === question.correctAnswerIndex,
                    })),
                })),
            });
            setTeacherMessage("Test created.");
            setNewTestTitle("");
            setQuestions([createEmptyQuestion()]);
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to create test."));
        }
    };

    const onDeleteSelectedTest = async () => {
        if (!selectedLessonTestId) {
            setTeacherError("Select test to delete.");
            return;
        }

        try {
            setTeacherError(null);
            await deleteTest(selectedLessonTestId);
            setTeacherMessage("Test deleted.");
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
            }
            if (selectedCourseId) {
                setCourseAttempts(await getCourseTestAttempts(selectedCourseId));
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, "Failed to delete test."));
        }
    };

    const updateQuestion = (index: number, patch: Partial<TestDraftQuestion>) => {
        setQuestions((prev) => prev.map((question, i) => (i === index ? { ...question, ...patch } : question)));
    };

    const updateQuestionAnswer = (questionIndex: number, answerIndex: number, value: string) => {
        setQuestions((prev) =>
            prev.map((question, qIndex) => {
                if (qIndex !== questionIndex) {
                    return question;
                }
                return {
                    ...question,
                    answers: question.answers.map((answer, aIndex) => (aIndex === answerIndex ? value : answer)),
                };
            })
        );
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, createEmptyQuestion()]);
    };

    const removeQuestion = (questionIndex: number) => {
        setQuestions((prev) => {
            if (prev.length <= 1) {
                return prev;
            }
            return prev.filter((_, index) => index !== questionIndex);
        });
    };

    const addAnswerToQuestion = (questionIndex: number) => {
        setQuestions((prev) =>
            prev.map((question, index) =>
                index === questionIndex ? { ...question, answers: [...question.answers, ""] } : question
            )
        );
    };

    const removeAnswerFromQuestion = (questionIndex: number, answerIndex: number) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex || question.answers.length <= 2) {
                    return question;
                }
                const answers = question.answers.filter((_, i) => i !== answerIndex);
                return {
                    ...question,
                    answers,
                    correctAnswerIndex: Math.min(question.correctAnswerIndex, answers.length - 1),
                };
            })
        );
    };

    const onPromoteToTeacher = async (userId: number) => {
        try {
            setAdminError(null);
            await updateUserRole(userId, ROLE_IDS.TEACHER);
            setAdminMessage("User promoted to teacher.");
            setAdminUsers(await getUsers());
        } catch (submitError) {
            setAdminError(getApiErrorMessage(submitError, "Failed to update user role."));
        }
    };

    const onModerateCourse = async (courseId: number, status: "APPROVED" | "REJECTED") => {
        try {
            setAdminError(null);
            await moderateCourse(courseId, status);
            setAdminMessage(`Course ${status === "APPROVED" ? "approved" : "rejected"}.`);
            setPendingCourses(await getPendingCourses());
        } catch (submitError) {
            setAdminError(getApiErrorMessage(submitError, "Failed to moderate course."));
        }
    };

    const groupedAttempts = (progress?.testAttempts ?? []).reduce<Record<number, TestAttemptItem[]>>(
        (acc, attempt) => {
            if (!acc[attempt.test.id]) {
                acc[attempt.test.id] = [];
            }
            acc[attempt.test.id].push(attempt);
            return acc;
        },
        {}
    );
    const selectedAttempts =
        selectedTestId && groupedAttempts[selectedTestId] ? groupedAttempts[selectedTestId] : [];
    const selectedCourse = useMemo(
        () => courses.find((course) => course.id === selectedCourseId) ?? null,
        [courses, selectedCourseId]
    );
    const selectedLesson = useMemo(
        () => teacherLessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
        [teacherLessons, selectedLessonId]
    );
    const filteredAdminUsers = adminUsers.filter((adminUser) => {
        const query = userSearchQuery.trim().toLowerCase();
        if (query.length === 0) {
            return true;
        }
        return (
            adminUser.email.toLowerCase().includes(query) ||
            adminUser.name.toLowerCase().includes(query) ||
            String(adminUser.id).includes(query)
        );
    });

    return (
        <main className="page">
            <header className="page-header">
                <h1 className="page-title">Profile</h1>
                <Link to="/courses">Back to courses</Link>
            </header>

            <section className="card">
                <AvatarUploader avatarUrl={user?.avatarUrl} onUpload={onAvatarUpload} />
                <p>
                    <strong>Name:</strong> {user?.name ?? "Not set"}
                </p>
                <p>
                    <strong>Email:</strong> {user?.email ?? "Unknown"}
                </p>
                <p>
                    <strong>User ID:</strong> {user?.id ?? "Unknown"}
                </p>
                <p>
                    <strong>Role ID:</strong> {user?.roleId ?? "Unknown"}
                </p>
            </section>

            <CollapsibleSection title="Course Progress" defaultOpen>
                {loading ? <p>Loading progress...</p> : null}
                {error ? <p className="auth-error">{error}</p> : null}
                {!loading && !error && progress?.courseProgress.length === 0 ? (
                    <p>No course progress yet.</p>
                ) : null}
                {progress?.courseProgress.map((item) => (
                    <p key={item.id}>
                        {item.course.title}: {item.progressPercent}% ({item.completedLessons} lessons)
                    </p>
                ))}
            </CollapsibleSection>

            <CollapsibleSection title="Test Attempts">
                {!loading && !error && progress?.testAttempts.length === 0 ? (
                    <p>No test attempts yet.</p>
                ) : null}
                {progress && progress.testAttempts.length > 0 ? (
                    <>
                        <label className="field-label" htmlFor="test-select">
                            Select test
                        </label>
                        <select
                            id="test-select"
                            value={selectedTestId ?? ""}
                            onChange={(event) => setSelectedTestId(Number(event.target.value))}
                        >
                            <option value="" disabled>
                                Choose test
                            </option>
                            {Object.entries(groupedAttempts).map(([testId, attempts]) => (
                                <option key={testId} value={testId}>
                                    {attempts[0].course.title} / {attempts[0].test.title}
                                </option>
                            ))}
                        </select>
                    </>
                ) : null}
                {selectedAttempts.map((attempt) => (
                    <p key={attempt.id}>
                        [{new Date(attempt.createdAt).toLocaleString()}] Score: {attempt.score}/{attempt.total}
                    </p>
                ))}
            </CollapsibleSection>

            {isTeacher ? (
                <CollapsibleSection title="Teacher Panel">
                    {teacherError ? <p className="auth-error">{teacherError}</p> : null}
                    {teacherMessage ? <p>{teacherMessage}</p> : null}
                    <p>
                        <strong>Your courses:</strong> {courses.length}
                    </p>

                    <CollapsibleSection title="Create course">
                        <div className="form-block">
                            <input
                                placeholder="Course title"
                                value={newCourseTitle}
                                onChange={(event) => setNewCourseTitle(event.target.value)}
                            />
                            <textarea
                                placeholder="Course description"
                                value={newCourseDescription}
                                onChange={(event) => setNewCourseDescription(event.target.value)}
                            />
                            <button type="button" onClick={onCreateCourse}>
                                Create course
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Edit selected course">
                        <div className="form-block">
                            <select
                                value={selectedCourseId ?? ""}
                                onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    Choose course
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        #{course.id} {course.title}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder="Updated title"
                                value={courseEditTitle}
                                onChange={(event) => setCourseEditTitle(event.target.value)}
                            />
                            <textarea
                                placeholder="Updated description"
                                value={courseEditDescription}
                                onChange={(event) => setCourseEditDescription(event.target.value)}
                            />
                            <button type="button" onClick={onUpdateCourse}>
                                Save course changes
                            </button>
                            <button type="button" className="ghost-button" onClick={onDeleteCourse}>
                                Delete selected course
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Create lesson">
                        <div className="form-block">
                            <select
                                value={selectedCourseId ?? ""}
                                onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    Choose course
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder="Lesson title"
                                value={newLessonTitle}
                                onChange={(event) => setNewLessonTitle(event.target.value)}
                            />
                            <textarea
                                placeholder="Lesson content"
                                value={newLessonContent}
                                onChange={(event) => setNewLessonContent(event.target.value)}
                            />
                            <input
                                placeholder="Lesson position in course (0, 1, 2...)"
                                type="number"
                                value={newLessonOrder}
                                onChange={(event) => setNewLessonOrder(event.target.value)}
                            />
                            <button type="button" onClick={onCreateLesson}>
                                Create lesson
                            </button>
                            <select
                                value={selectedLessonId ?? ""}
                                onChange={(event) => setSelectedLessonId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    Select lesson to delete
                                </option>
                                {teacherLessons.map((lesson, index) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        Lesson #{index + 1}: {lesson.title}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="ghost-button" onClick={onDeleteLesson}>
                                Delete selected lesson
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Create test">
                        <div className="form-block">
                            <select
                                value={selectedLessonId ?? ""}
                                onChange={(event) => setSelectedLessonId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    Choose lesson
                                </option>
                                {teacherLessons.map((lesson, index) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        Lesson #{index + 1}: {lesson.title}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder="Test title"
                                value={newTestTitle}
                                onChange={(event) => setNewTestTitle(event.target.value)}
                            />

                            {questions.map((question, questionIndex) => (
                                <div key={`question-${questionIndex}`} className="card">
                                    <div className="inline-row">
                                        <strong>Question #{questionIndex + 1}</strong>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            onClick={() => removeQuestion(questionIndex)}
                                            disabled={questions.length <= 1}
                                        >
                                            Remove question
                                        </button>
                                    </div>
                                    <input
                                        placeholder="Question text"
                                        value={question.text}
                                        onChange={(event) =>
                                            updateQuestion(questionIndex, { text: event.target.value })
                                        }
                                    />
                                    {question.answers.map((answer, answerIndex) => (
                                        <div key={`question-${questionIndex}-answer-${answerIndex}`} className="answer-row">
                                            <input
                                                placeholder={`Answer option #${answerIndex + 1}`}
                                                value={answer}
                                                onChange={(event) =>
                                                    updateQuestionAnswer(questionIndex, answerIndex, event.target.value)
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="ghost-button"
                                                onClick={() => removeAnswerFromQuestion(questionIndex, answerIndex)}
                                                disabled={question.answers.length <= 2}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => addAnswerToQuestion(questionIndex)}
                                    >
                                        Add answer option
                                    </button>
                                    <select
                                        value={question.correctAnswerIndex}
                                        onChange={(event) =>
                                            updateQuestion(questionIndex, {
                                                correctAnswerIndex: Number(event.target.value),
                                            })
                                        }
                                    >
                                        {question.answers.map((_, index) => (
                                            <option key={`correct-${questionIndex}-${index}`} value={index}>
                                                Correct answer: option #{index + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            <button type="button" className="ghost-button" onClick={addQuestion}>
                                Add one more question
                            </button>
                            <button type="button" onClick={onCreateTest}>
                                Create test
                            </button>

                            <select
                                value={selectedLessonTestId ?? ""}
                                onChange={(event) => setSelectedLessonTestId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    Select test to delete
                                </option>
                                {selectedLesson?.tests?.map((test) => (
                                    <option key={test.id} value={test.id}>
                                        {test.title}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="ghost-button" onClick={onDeleteSelectedTest}>
                                Delete selected test
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Add teacher to selected course">
                        <div className="form-block">
                            <p className="muted-text">
                                Your ID: <strong>{user?.id ?? "-"}</strong>
                            </p>
                            <div className="inline-row">
                                <input
                                    placeholder="Teacher user ID"
                                    value={teacherToAssign}
                                    onChange={(event) => setTeacherToAssign(event.target.value)}
                                />
                                <button type="button" onClick={onAddTeacher}>
                                    Add teacher
                                </button>
                            </div>
                            {selectedCourse?.teachers?.map((teacherRelation) => (
                                <p key={teacherRelation.id}>
                                    Teacher: {teacherRelation.user.name} ({teacherRelation.user.email})
                                </p>
                            ))}
                        </div>
                    </CollapsibleSection>

                    <div className="form-block">
                        <h3>Course test attempts</h3>
                        {courseAttempts.length === 0 ? <p>No attempts for selected course.</p> : null}
                        {courseAttempts.map((attempt) => (
                            <p key={attempt.id}>
                                [{new Date(attempt.createdAt).toLocaleString()}] {attempt.user.email} - {attempt.test.title}:{" "}
                                {attempt.score}/{attempt.total}
                            </p>
                        ))}
                    </div>
                </CollapsibleSection>
            ) : null}

            {isAdmin ? (
                <CollapsibleSection title="Admin Panel">
                    {adminError ? <p className="auth-error">{adminError}</p> : null}
                    {adminMessage ? <p>{adminMessage}</p> : null}

                    <div className="form-block">
                        <h3>User role management</h3>
                        <input
                            placeholder="Search by id, name or email"
                            value={userSearchQuery}
                            onChange={(event) => setUserSearchQuery(event.target.value)}
                        />
                        {filteredAdminUsers.map((adminUser) => (
                            <div key={adminUser.id} className="inline-row">
                                <span>
                                    #{adminUser.id} {adminUser.email} (role: {adminUser.roleId})
                                </span>
                                {adminUser.roleId !== ROLE_IDS.TEACHER && adminUser.roleId !== ROLE_IDS.ADMIN ? (
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => onPromoteToTeacher(adminUser.id)}
                                    >
                                        Promote to teacher
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="form-block">
                        <h3>Pending courses moderation</h3>
                        {pendingCourses.length === 0 ? <p>No pending courses.</p> : null}
                        {pendingCourses.map((course) => (
                            <div key={course.id} className="card">
                                <p>
                                    <strong>
                                        #{course.id} {course.title}
                                    </strong>
                                </p>
                                <p>{course.description}</p>
                                <p className="muted-text">
                                    Author: {course.author?.name ?? course.author?.email ?? "Unknown"}
                                </p>
                                <div className="inline-row">
                                    <button type="button" onClick={() => onModerateCourse(course.id, "APPROVED")}>
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => onModerateCourse(course.id, "REJECTED")}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            ) : null}

            <button type="button" className="ghost-button" onClick={onLogout}>
                Sign out
            </button>
        </main>
    );
};

export default ProfileDashboard;
