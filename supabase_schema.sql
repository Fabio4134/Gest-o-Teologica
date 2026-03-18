-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'master');

-- Users table (linked to Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  display_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'student',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID REFERENCES public.users PRIMARY KEY,
  bio TEXT,
  specialization TEXT,
  phone TEXT,
  curriculum TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects/Courses table
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table (extended info)
CREATE TABLE public.students (
  id UUID REFERENCES public.users PRIMARY KEY,
  registration_number TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  address TEXT,
  birth_date DATE,
  cpf TEXT UNIQUE,
  church TEXT
);

-- Questions table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams table
CREATE TABLE public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  questions JSONB NOT NULL, -- Array of question IDs or objects
  duration_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Results table
CREATE TABLE public.exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id),
  exam_id UUID REFERENCES public.exams(id),
  score NUMERIC(5,2),
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id),
  lesson_topic TEXT,
  date TIMESTAMPTZ NOT NULL,
  present_student_ids UUID[], -- Array of user IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finances table
CREATE TABLE public.finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' or 'expense'
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  student_id UUID REFERENCES public.users(id)
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
