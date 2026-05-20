import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import { setUser } from "@/features/auth/model/authSlice";
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
import { useTranslation } from "@/shared/lib/i18n";
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
    const { t } = useTranslation();
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
                setError(getApiErrorMessage(loadError, t("profile.loadProgressFailed")));
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
                setTeacherError(getApiErrorMessage(loadError, t("messages.loadCoursesFailed")));
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
                setAdminError(getApiErrorMessage(loadError, t("messages.loadAdminFailed")));
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
                setTeacherError(getApiErrorMessage(loadError, t("messages.loadLessonsFailed")));
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
                setTeacherError(getApiErrorMessage(loadError, t("messages.loadAttemptsFailed")));
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

    const onAvatarUpload = async (avatarUrl: string) => {
        try {
            const updatedUser = await updateMyAvatar(avatarUrl);
            dispatch(setUser(updatedUser));
        } catch (uploadError) {
            throw new Error(getApiErrorMessage(uploadError, t("messages.uploadAvatarFailed")));
        }
    };

    const onCreateCourse = async () => {
        try {
            setTeacherError(null);
            const course = await createCourse(newCourseTitle.trim(), newCourseDescription.trim());
            setCourses((prev) => [...prev, course]);
            setSelectedCourseId(course.id);
            setTeacherMessage(t("messages.courseCreated"));
            setNewCourseTitle("");
            setNewCourseDescription("");
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.createCourseFailed")));
        }
    };

    const onUpdateCourse = async () => {
        if (!selectedCourseId) {
            setTeacherError(t("messages.selectCourse"));
            return;
        }
        try {
            setTeacherError(null);
            await updateCourse(selectedCourseId, courseEditTitle.trim(), courseEditDescription.trim());
            await reloadManageableCourses();
            setTeacherMessage(t("messages.courseUpdated"));
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.updateCourseFailed")));
        }
    };

    const onAddTeacher = async () => {
        if (!selectedCourseId) {
            setTeacherError(t("messages.selectCourse"));
            return;
        }

        const teacherUserId = Number(teacherToAssign);
        if (!Number.isInteger(teacherUserId) || teacherUserId <= 0) {
            setTeacherError(t("messages.validTeacherId"));
            return;
        }

        try {
            setTeacherError(null);
            await addTeacherToCourse(selectedCourseId, teacherUserId);
            setTeacherToAssign("");
            setTeacherMessage(t("messages.teacherAdded"));
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.addTeacherFailed")));
        }
    };

    const onCreateLesson = async () => {
        if (!selectedCourseId) {
            setTeacherError(t("messages.selectCourse"));
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
            setTeacherMessage(t("messages.lessonCreated"));
            setNewLessonTitle("");
            setNewLessonContent("");
            setNewLessonOrder("0");
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.createLessonFailed")));
        }
    };

    const onDeleteCourse = async () => {
        if (!selectedCourseId) {
            setTeacherError(t("messages.selectCourse"));
            return;
        }
        try {
            setTeacherError(null);
            await deleteCourse(selectedCourseId);
            setTeacherMessage(t("messages.courseDeleted"));
            setSelectedCourseId(null);
            setSelectedLessonId(null);
            await reloadManageableCourses();
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.deleteCourseFailed")));
        }
    };

    const onDeleteLesson = async () => {
        if (!selectedLessonId) {
            setTeacherError(t("messages.selectLesson"));
            return;
        }
        try {
            setTeacherError(null);
            await deleteLesson(selectedLessonId);
            setTeacherMessage(t("messages.lessonDeleted"));
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
                setSelectedLessonId(lessons[0]?.id ?? null);
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.deleteLessonFailed")));
        }
    };

    const onCreateTest = async () => {
        if (!selectedLessonId) {
            setTeacherError(t("messages.selectLesson"));
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
            setTeacherError(t("messages.validQuestion"));
            return;
        }

        if (
            normalizedQuestions.some(
                (question) => question.answers.length < 2 || question.correctAnswerIndex >= question.answers.length
            )
        ) {
            setTeacherError(t("messages.validAnswers"));
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
            setTeacherMessage(t("messages.testCreated"));
            setNewTestTitle("");
            setQuestions([createEmptyQuestion()]);
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.createTestFailed")));
        }
    };

    const onDeleteSelectedTest = async () => {
        if (!selectedLessonTestId) {
            setTeacherError(t("messages.selectTest"));
            return;
        }

        try {
            setTeacherError(null);
            await deleteTest(selectedLessonTestId);
            setTeacherMessage(t("messages.testDeleted"));
            if (selectedCourseId) {
                const lessons = await getLessonsByCourse(selectedCourseId);
                setTeacherLessons(lessons);
            }
            if (selectedCourseId) {
                setCourseAttempts(await getCourseTestAttempts(selectedCourseId));
            }
        } catch (submitError) {
            setTeacherError(getApiErrorMessage(submitError, t("messages.deleteTestFailed")));
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
            setAdminMessage(t("messages.userPromoted"));
            setAdminUsers(await getUsers());
        } catch (submitError) {
            setAdminError(getApiErrorMessage(submitError, t("messages.updateRoleFailed")));
        }
    };

    const onModerateCourse = async (courseId: number, status: "APPROVED" | "REJECTED") => {
        try {
            setAdminError(null);
            await moderateCourse(courseId, status);
            setAdminMessage(
                status === "APPROVED" ? t("messages.courseApproved") : t("messages.courseRejected")
            );
            setPendingCourses(await getPendingCourses());
        } catch (submitError) {
            setAdminError(getApiErrorMessage(submitError, t("messages.moderateFailed")));
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
                <div>
                    <h1 className="page-title">{t("profile.title")}</h1>
                    <p className="page-subtitle">{t("profile.subtitle")}</p>
                </div>
            </header>

            <section className="card page-section">
                <div className="profile-header" style={{ border: "none", margin: 0, padding: 0 }}>
                    <AvatarUploader avatarUrl={user?.avatarUrl} onUpload={onAvatarUpload} />
                    <div className="profile-info">
                        <p className="profile-name">{user?.name ?? t("profile.notSet")}</p>
                        <p className="profile-email">{user?.email ?? t("common.unknown")}</p>
                        <div className="profile-meta">
                            <span className="chip chip-pending">
                                {t("common.id")} {user?.id ?? "—"}
                            </span>
                            <span className="chip chip-pending">
                                {t("common.role")} {user?.roleId ?? "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <CollapsibleSection title={t("profile.courseProgress")} defaultOpen>
                {loading ? <p>{t("profile.loadingProgress")}</p> : null}
                {error ? <p className="auth-error">{error}</p> : null}
                {!loading && !error && progress?.courseProgress.length === 0 ? (
                    <p>{t("profile.noProgress")}</p>
                ) : null}
                {progress?.courseProgress.map((item) => (
                    <p key={item.id}>
                        {t("profile.progressLine", {
                            title: item.course.title,
                            percent: item.progressPercent,
                            lessons: item.completedLessons,
                        })}
                    </p>
                ))}
            </CollapsibleSection>

            <CollapsibleSection title={t("profile.testAttempts")}>
                {!loading && !error && progress?.testAttempts.length === 0 ? (
                    <p>{t("profile.noAttempts")}</p>
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
                                {t("profile.chooseTest")}
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
                        {t("profile.attemptLine", {
                            date: new Date(attempt.createdAt).toLocaleString(),
                            score: attempt.score,
                            total: attempt.total,
                        })}
                    </p>
                ))}
            </CollapsibleSection>

            {isTeacher ? (
                <CollapsibleSection title={t("profile.teacherPanel")}>
                    {teacherError ? <p className="auth-error">{teacherError}</p> : null}
                    {teacherMessage ? <p>{teacherMessage}</p> : null}
                    <p>
                        <strong>{t("profile.yourCourses")}:</strong> {courses.length}
                    </p>

                    <CollapsibleSection title={t("profile.createCourse")}>
                        <div className="form-block">
                            <input
                                placeholder={t("profile.courseTitle")}
                                value={newCourseTitle}
                                onChange={(event) => setNewCourseTitle(event.target.value)}
                            />
                            <textarea
                                placeholder={t("profile.courseDescription")}
                                value={newCourseDescription}
                                onChange={(event) => setNewCourseDescription(event.target.value)}
                            />
                            <button type="button" className="btn-primary" onClick={onCreateCourse}>
                                {t("profile.createCourseBtn")}
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title={t("profile.editCourse")}>
                        <div className="form-block">
                            <select
                                value={selectedCourseId ?? ""}
                                onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    {t("profile.chooseCourse")}
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        #{course.id} {course.title}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder={t("profile.updatedTitle")}
                                value={courseEditTitle}
                                onChange={(event) => setCourseEditTitle(event.target.value)}
                            />
                            <textarea
                                placeholder={t("profile.updatedDescription")}
                                value={courseEditDescription}
                                onChange={(event) => setCourseEditDescription(event.target.value)}
                            />
                            <button type="button" className="btn-primary" onClick={onUpdateCourse}>
                                {t("profile.saveCourse")}
                            </button>
                            <button type="button" className="ghost-button" onClick={onDeleteCourse}>
                                {t("profile.deleteCourse")}
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title={t("profile.createLesson")}>
                        <div className="form-block">
                            <select
                                value={selectedCourseId ?? ""}
                                onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    {t("profile.chooseCourse")}
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder={t("profile.lessonTitle")}
                                value={newLessonTitle}
                                onChange={(event) => setNewLessonTitle(event.target.value)}
                            />
                            <textarea
                                placeholder={t("profile.lessonContent")}
                                value={newLessonContent}
                                onChange={(event) => setNewLessonContent(event.target.value)}
                            />
                            <input
                                placeholder={t("profile.lessonOrder")}
                                type="number"
                                value={newLessonOrder}
                                onChange={(event) => setNewLessonOrder(event.target.value)}
                            />
                            <button type="button" className="btn-primary" onClick={onCreateLesson}>
                                {t("profile.createLessonBtn")}
                            </button>
                            <select
                                value={selectedLessonId ?? ""}
                                onChange={(event) => setSelectedLessonId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    {t("profile.selectLessonDelete")}
                                </option>
                                {teacherLessons.map((lesson, index) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {t("profile.lessonOption", { n: index + 1, title: lesson.title })}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="ghost-button" onClick={onDeleteLesson}>
                                {t("profile.deleteLesson")}
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title={t("profile.createTest")}>
                        <div className="form-block">
                            <select
                                value={selectedLessonId ?? ""}
                                onChange={(event) => setSelectedLessonId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    {t("profile.chooseLesson")}
                                </option>
                                {teacherLessons.map((lesson, index) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {t("profile.lessonOption", { n: index + 1, title: lesson.title })}
                                    </option>
                                ))}
                            </select>
                            <input
                                placeholder={t("profile.testTitle")}
                                value={newTestTitle}
                                onChange={(event) => setNewTestTitle(event.target.value)}
                            />

                            {questions.map((question, questionIndex) => (
                                <div key={`question-${questionIndex}`} className="card">
                                    <div className="inline-row">
                                        <strong>{t("profile.questionN", { n: questionIndex + 1 })}</strong>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            onClick={() => removeQuestion(questionIndex)}
                                            disabled={questions.length <= 1}
                                        >
                                            {t("profile.removeQuestion")}
                                        </button>
                                    </div>
                                    <input
                                        placeholder={t("profile.questionText")}
                                        value={question.text}
                                        onChange={(event) =>
                                            updateQuestion(questionIndex, { text: event.target.value })
                                        }
                                    />
                                    {question.answers.map((answer, answerIndex) => (
                                        <div key={`question-${questionIndex}-answer-${answerIndex}`} className="answer-row">
                                            <input
                                                placeholder={t("profile.answerN", { n: answerIndex + 1 })}
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
                                                {t("profile.remove")}
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => addAnswerToQuestion(questionIndex)}
                                    >
                                        {t("profile.addAnswer")}
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
                                                {t("profile.correctAnswer", { n: index + 1 })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            <button type="button" className="ghost-button" onClick={addQuestion}>
                                {t("profile.addQuestion")}
                            </button>
                            <button type="button" className="btn-primary" onClick={onCreateTest}>
                                {t("profile.createTestBtn")}
                            </button>

                            <select
                                value={selectedLessonTestId ?? ""}
                                onChange={(event) => setSelectedLessonTestId(Number(event.target.value))}
                            >
                                <option value="" disabled>
                                    {t("profile.selectTestDelete")}
                                </option>
                                {selectedLesson?.tests?.map((test) => (
                                    <option key={test.id} value={test.id}>
                                        {test.title}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="ghost-button" onClick={onDeleteSelectedTest}>
                                {t("profile.deleteTest")}
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title={t("profile.addTeacher")}>
                        <div className="form-block">
                            <p className="muted-text">
                                {t("profile.yourId")}: <strong>{user?.id ?? "-"}</strong>
                            </p>
                            <div className="inline-row">
                                <input
                                    placeholder={t("profile.teacherUserId")}
                                    value={teacherToAssign}
                                    onChange={(event) => setTeacherToAssign(event.target.value)}
                                />
                                <button type="button" className="btn-primary" onClick={onAddTeacher}>
                                    {t("profile.addTeacherBtn")}
                                </button>
                            </div>
                            {selectedCourse?.teachers?.map((teacherRelation) => (
                                <p key={teacherRelation.id}>
                                    {t("profile.teacherLine", {
                                        name: teacherRelation.user.name,
                                        email: teacherRelation.user.email,
                                    })}
                                </p>
                            ))}
                        </div>
                    </CollapsibleSection>

                    <div className="form-block">
                        <h3>{t("profile.courseAttempts")}</h3>
                        {courseAttempts.length === 0 ? <p>{t("profile.noAttemptsCourse")}</p> : null}
                        {courseAttempts.map((attempt) => (
                            <p key={attempt.id}>
                                {t("profile.attemptCourseLine", {
                                    date: new Date(attempt.createdAt).toLocaleString(),
                                    email: attempt.user.email,
                                    test: attempt.test.title,
                                    score: attempt.score,
                                    total: attempt.total,
                                })}
                            </p>
                        ))}
                    </div>
                </CollapsibleSection>
            ) : null}

            {isAdmin ? (
                <CollapsibleSection title={t("profile.adminPanel")}>
                    {adminError ? <p className="auth-error">{adminError}</p> : null}
                    {adminMessage ? <p>{adminMessage}</p> : null}

                    <div className="form-block">
                        <h3>{t("profile.userRoles")}</h3>
                        <input
                            placeholder={t("profile.searchUsers")}
                            value={userSearchQuery}
                            onChange={(event) => setUserSearchQuery(event.target.value)}
                        />
                        {filteredAdminUsers.map((adminUser) => (
                            <div key={adminUser.id} className="inline-row">
                                <span>
                                    {t("profile.userLine", {
                                        id: adminUser.id,
                                        email: adminUser.email,
                                        role: adminUser.roleId,
                                    })}
                                </span>
                                {adminUser.roleId !== ROLE_IDS.TEACHER && adminUser.roleId !== ROLE_IDS.ADMIN ? (
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => onPromoteToTeacher(adminUser.id)}
                                    >
                                        {t("profile.promoteTeacher")}
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="form-block">
                        <h3>{t("profile.pendingCourses")}</h3>
                        {pendingCourses.length === 0 ? <p>{t("profile.noPending")}</p> : null}
                        {pendingCourses.map((course) => (
                            <div key={course.id} className="card">
                                <p>
                                    <strong>
                                        #{course.id} {course.title}
                                    </strong>
                                </p>
                                <p>{course.description}</p>
                                <p className="muted-text">
                                    {t("profile.author")}:{" "}
                                    {course.author?.name ?? course.author?.email ?? t("common.unknown")}
                                </p>
                                <div className="inline-row">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => onModerateCourse(course.id, "APPROVED")}
                                    >
                                        {t("profile.approve")}
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => onModerateCourse(course.id, "REJECTED")}
                                    >
                                        {t("profile.reject")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            ) : null}

        </main>
    );
};

export default ProfileDashboard;
