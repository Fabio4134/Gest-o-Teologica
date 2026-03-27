export type UserRole = 'student' | 'teacher' | 'master';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  photoURL?: string;
}

export interface StudentDetails {
  uid: string;
  registrationNumber: string;
  status: 'active' | 'inactive' | 'graduated' | 'pending';
  enrollmentDate: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  cpf?: string;
  church?: string;
}

export interface TeacherDetails {
  uid: string;
  bio: string;
  specialization: string;
  phone?: string;
  email: string;
  curriculum?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
}

export interface Attendance {
  id: string;
  subject_id: string;
  date: string;
  present_student_ids: string[];
  lesson_topic?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subjectId?: string;
  subject_id?: string; // For Supabase compatibility
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  questions: string[]; // IDs of questions
  durationMinutes: number;
  active: boolean;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  answers: number[]; // index of selected options
  completedAt: string;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  studentId?: string;
}
