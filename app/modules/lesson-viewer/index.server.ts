/**
 * Data behind the Student's lesson page: the course and its curriculum,
 * Lesson progress and watch position, the lesson's Discussion thread, and
 * quizzes with their grading.
 */
export {
  getCourseWithDetails,
  getLessonById,
  getModuleById,
  getUserById,
  getLessonProgress,
  getLessonProgressForCourse,
  markLessonComplete,
  markLessonInProgress,
  getLastWatchPosition,
  calculateWatchProgress,
  flattenCourseLessons,
} from "./lib/course.server";
export {
  getCommentById,
  getLessonThread,
  renderThread,
} from "./lib/comments.server";
export {
  getQuizByLessonId,
  getQuizWithQuestions,
  getBestAttempt,
  computeResult,
} from "./lib/quiz.server";
