import { storage } from './storage';
import { mediaService, MediaType } from './mediaService';
import { broadcastingService, BroadcastType } from './broadcastingService';
import { monitoringService } from './monitoringService';
import crypto from 'crypto';

export enum CourseCategory {
  MEDIA_PRODUCTION = 'media_production',
  VIDEO_EDITING = 'video_editing',
  AUDIO_PRODUCTION = 'audio_production',
  CONTENT_CREATION = 'content_creation',
  STREAMING_TECHNOLOGY = 'streaming_technology',
  ADULT_INDUSTRY_BUSINESS = 'adult_industry_business',
  ADULT_INDUSTRY_LEGAL = 'adult_industry_legal',
  ADULT_INDUSTRY_SAFETY = 'adult_industry_safety',
  MARKETING = 'marketing',
  PHOTOGRAPHY = 'photography',
  SOCIAL_MEDIA = 'social_media',
  ENTREPRENEURSHIP = 'entrepreneurship',
  DIGITAL_MARKETING = 'digital_marketing',
  PLATFORM_MANAGEMENT = 'platform_management'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  INTERACTIVE = 'interactive',
  LIVE_SESSION = 'live_session',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  WORKSHOP = 'workshop'
}

export enum CertificationLevel {
  COMPLETION = 'completion',
  PROFICIENCY = 'proficiency',
  MASTERY = 'mastery',
  EXPERT = 'expert'
}

export interface EducationProfile {
  userId: string;
  displayName: string;
  bio: string;
  expertise: CourseCategory[];
  skillLevel: SkillLevel;
  isMentor: boolean;
  isMentee: boolean;
  yearsExperience: number;
  specializations: string[];
  languages: string[];
  timezone: string;
  availability: {
    days: number[]; // 0-6, Sunday=0
    hours: { start: string; end: string }; // "09:00", "17:00"
  };
  rates: {
    hourlyRate?: number;
    sessionRate?: number;
    currency: string;
  };
  portfolio: PortfolioItem[];
  certifications: Certification[];
  reviews: Review[];
  averageRating: number;
  totalStudents: number;
  totalSessions: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  category: CourseCategory;
  tags: string[];
  createdAt: Date;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  level: CertificationLevel;
  category: CourseCategory;
  earnedAt: Date;
  expiresAt?: Date;
  credentialUrl?: string;
  skills: string[];
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  courseId?: string;
  sessionId?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  category: CourseCategory;
  skillLevel: SkillLevel;
  duration: number; // total minutes
  price: number;
  currency: string;
  enrollmentCount: number;
  averageRating: number;
  coverImageUrl: string;
  previewVideoUrl?: string;
  syllabus: CourseSyllabus;
  lessons: Lesson[];
  assignments: Assignment[];
  prerequisites: string[];
  learningObjectives: string[];
  tools: string[];
  certificates: CertificationLevel[];
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSyllabus {
  modules: SyllabusModule[];
  totalLessons: number;
  totalDuration: number;
  practicalProjects: number;
  assessments: number;
}

export interface SyllabusModule {
  id: string;
  title: string;
  description: string;
  lessons: string[]; // lesson IDs
  duration: number; // minutes
  order: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  content: LessonContent;
  duration: number; // minutes
  order: number;
  isPreview: boolean;
  prerequisites: string[];
  learningObjectives: string[];
  resources: LessonResource[];
  isCompleted?: boolean;
  completedAt?: Date;
}

export interface LessonContent {
  text?: string;
  videoUrl?: string;
  audioUrl?: string;
  slides?: string[];
  interactiveElements?: InteractiveElement[];
  codeExamples?: CodeExample[];
  downloadableFiles?: string[];
}

export interface InteractiveElement {
  type: 'quiz' | 'poll' | 'simulation' | 'exercise';
  data: any;
  points?: number;
}

export interface CodeExample {
  language: string;
  code: string;
  description: string;
  runnable: boolean;
}

export interface LessonResource {
  title: string;
  type: 'document' | 'link' | 'tool' | 'template';
  url: string;
  description?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  type: 'project' | 'essay' | 'practical' | 'portfolio';
  maxPoints: number;
  dueDate?: Date;
  submissionFormat: string[];
  rubric: AssignmentRubric[];
  examples?: string[];
}

export interface AssignmentRubric {
  criterion: string;
  maxPoints: number;
  levels: {
    name: string;
    points: number;
    description: string;
  }[];
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description: string;
  category: CourseCategory;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingUrl?: string;
  agenda: string[];
  notes?: string;
  homework?: string[];
  nextSession?: Date;
  rating?: number;
  feedback?: string;
  price: number;
  currency: string;
}

export interface MentorshipProgram {
  id: string;
  mentorId: string;
  title: string;
  description: string;
  category: CourseCategory;
  duration: number; // weeks
  sessionsPerWeek: number;
  maxMentees: number;
  currentMentees: number;
  price: number;
  currency: string;
  curriculum: ProgramCurriculum[];
  requirements: string[];
  outcomes: string[];
  isActive: boolean;
}

export interface ProgramCurriculum {
  week: number;
  topic: string;
  objectives: string[];
  activities: string[];
  deliverables: string[];
}

export interface SkillAssessment {
  id: string;
  category: CourseCategory;
  questions: AssessmentQuestion[];
  passingScore: number;
  duration: number; // minutes
  attempts: number;
  certificateLevel: CertificationLevel;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'practical';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  mediaUrl?: string;
}

export interface LiveWorkshop {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  category: CourseCategory;
  scheduledAt: Date;
  duration: number; // minutes
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  currency: string;
  broadcastId?: string;
  materials: string[];
  recordingUrl?: string;
  isRecorded: boolean;
}

export class EducationService {
  private profiles: Map<string, EducationProfile> = new Map();
  private courses: Map<string, Course> = new Map();
  private sessions: Map<string, MentorshipSession> = new Map();
  private programs: Map<string, MentorshipProgram> = new Map();
  private assessments: Map<string, SkillAssessment> = new Map();
  private workshops: Map<string, LiveWorkshop> = new Map();

  // Profile Management
  async createEducationProfile(
    userId: string,
    profileData: Omit<EducationProfile, 'userId' | 'reviews' | 'averageRating' | 'totalStudents' | 'totalSessions'>
  ): Promise<EducationProfile> {
    const profile: EducationProfile = {
      userId,
      ...profileData,
      reviews: [],
      averageRating: 0,
      totalStudents: 0,
      totalSessions: 0
    };

    this.profiles.set(userId, profile);

    console.log(`Created education profile for user: ${userId}`);
    monitoringService.trackBusinessMetric('education_profile_created', 1, { 
      userId,
      isMentor: profile.isMentor,
      isMentee: profile.isMentee 
    });

    return profile;
  }

  async updateEducationProfile(
    userId: string,
    updates: Partial<EducationProfile>
  ): Promise<EducationProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error('Education profile not found');
    }

    Object.assign(profile, updates);
    this.profiles.set(userId, profile);

    return profile;
  }

  // Course Creation and Management
  async createCourse(
    instructorId: string,
    courseData: Omit<Course, 'id' | 'enrollmentCount' | 'averageRating' | 'createdAt' | 'updatedAt'>
  ): Promise<Course> {
    const courseId = crypto.randomUUID();

    const course: Course = {
      id: courseId,
      ...courseData,
      instructorId,
      enrollmentCount: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.courses.set(courseId, course);

    console.log(`Created course: ${course.title} by instructor ${instructorId}`);
    monitoringService.trackBusinessMetric('course_created', 1, { 
      category: course.category,
      skillLevel: course.skillLevel,
      price: course.price 
    });

    return course;
  }

  async addLessonToCourse(
    courseId: string,
    lessonData: Omit<Lesson, 'id' | 'courseId'>
  ): Promise<Lesson> {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const lesson: Lesson = {
      id: crypto.randomUUID(),
      courseId,
      ...lessonData
    };

    course.lessons.push(lesson);
    course.updatedAt = new Date();

    console.log(`Added lesson: ${lesson.title} to course ${courseId}`);

    return lesson;
  }

  async createLiveWorkshop(
    instructorId: string,
    workshopData: Omit<LiveWorkshop, 'id' | 'instructorId' | 'currentAttendees' | 'broadcastId' | 'recordingUrl'>
  ): Promise<LiveWorkshop> {
    const workshopId = crypto.randomUUID();

    const workshop: LiveWorkshop = {
      id: workshopId,
      instructorId,
      currentAttendees: 0,
      ...workshopData
    };

    // Create broadcast session for live workshop
    if (workshop.scheduledAt > new Date()) {
      const broadcast = await broadcastingService.createBroadcast(
        instructorId,
        workshop.title,
        BroadcastType.WEBINAR,
        {
          description: workshop.description,
          isRecording: workshop.isRecorded,
          maxViewers: workshop.maxAttendees,
          schedule: {
            scheduledStart: workshop.scheduledAt,
            estimatedDuration: workshop.duration,
            reminders: {
              subscribersOnly: false,
              sendAt: [60, 15, 5]
            }
          }
        }
      );

      workshop.broadcastId = broadcast.id;
    }

    this.workshops.set(workshopId, workshop);

    console.log(`Created live workshop: ${workshop.title}`);
    monitoringService.trackBusinessMetric('workshop_created', 1, { 
      category: workshop.category,
      price: workshop.price 
    });

    return workshop;
  }

  // Mentorship System
  async findMentors(
    category: CourseCategory,
    skillLevel: SkillLevel,
    budget?: number,
    timezone?: string
  ): Promise<EducationProfile[]> {
    const mentors = Array.from(this.profiles.values()).filter(profile => {
      return (
        profile.isMentor &&
        profile.expertise.includes(category) &&
        (skillLevel === SkillLevel.BEGINNER || profile.skillLevel >= skillLevel) &&
        (!budget || (profile.rates.hourlyRate && profile.rates.hourlyRate <= budget)) &&
        (!timezone || profile.timezone === timezone)
      );
    });

    // Sort by rating and experience
    return mentors.sort((a, b) => {
      if (a.averageRating !== b.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.yearsExperience - a.yearsExperience;
    });
  }

  async matchMentorMentee(
    menteeId: string,
    preferences: {
      category: CourseCategory;
      skillLevel: SkillLevel;
      budget: number;
      timezone?: string;
      availability?: { days: number[]; hours: { start: string; end: string } };
    }
  ): Promise<EducationProfile[]> {
    const mentee = this.profiles.get(menteeId);
    if (!mentee) {
      throw new Error('Mentee profile not found');
    }

    let mentors = await this.findMentors(
      preferences.category,
      preferences.skillLevel,
      preferences.budget,
      preferences.timezone
    );

    // Advanced matching algorithm
    if (preferences.availability) {
      mentors = mentors.filter(mentor => {
        const commonDays = mentor.availability.days.some(day => 
          preferences.availability!.days.includes(day)
        );
        return commonDays;
      });
    }

    // Score mentors based on compatibility
    const scoredMentors = mentors.map(mentor => {
      let score = 0;
      
      // Rating weight (40%)
      score += mentor.averageRating * 0.4;
      
      // Experience weight (30%)
      score += Math.min(mentor.yearsExperience / 10, 1) * 0.3;
      
      // Specialization match (20%)
      const specializationMatch = mentor.specializations.some(spec =>
        mentee.expertise.some(exp => spec.toLowerCase().includes(exp.toLowerCase()))
      );
      if (specializationMatch) score += 0.2;
      
      // Price match (10%)
      if (mentor.rates.hourlyRate && mentor.rates.hourlyRate <= preferences.budget) {
        score += (preferences.budget - mentor.rates.hourlyRate) / preferences.budget * 0.1;
      }

      return { mentor, score };
    });

    return scoredMentors
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.mentor);
  }

  async scheduleMentorshipSession(
    mentorId: string,
    menteeId: string,
    sessionData: Omit<MentorshipSession, 'id' | 'mentorId' | 'menteeId' | 'status'>
  ): Promise<MentorshipSession> {
    const mentor = this.profiles.get(mentorId);
    const mentee = this.profiles.get(menteeId);

    if (!mentor || !mentee) {
      throw new Error('Mentor or mentee profile not found');
    }

    const sessionId = crypto.randomUUID();

    const session: MentorshipSession = {
      id: sessionId,
      mentorId,
      menteeId,
      status: 'scheduled',
      meetingUrl: `https://meet.fanzlab.com/session/${sessionId}`,
      ...sessionData
    };

    this.sessions.set(sessionId, session);

    console.log(`Scheduled mentorship session: ${session.title}`);
    monitoringService.trackBusinessMetric('mentorship_session_scheduled', session.price, {
      category: session.category,
      duration: session.duration
    });

    return session;
  }

  async createMentorshipProgram(
    mentorId: string,
    programData: Omit<MentorshipProgram, 'id' | 'mentorId' | 'currentMentees'>
  ): Promise<MentorshipProgram> {
    const programId = crypto.randomUUID();

    const program: MentorshipProgram = {
      id: programId,
      mentorId,
      currentMentees: 0,
      ...programData
    };

    this.programs.set(programId, program);

    console.log(`Created mentorship program: ${program.title}`);
    monitoringService.trackBusinessMetric('mentorship_program_created', program.price, {
      category: program.category,
      duration: program.duration
    });

    return program;
  }

  // Skill Assessment and Certification
  async createSkillAssessment(
    category: CourseCategory,
    assessmentData: Omit<SkillAssessment, 'id' | 'category'>
  ): Promise<SkillAssessment> {
    const assessmentId = crypto.randomUUID();

    const assessment: SkillAssessment = {
      id: assessmentId,
      category,
      ...assessmentData
    };

    this.assessments.set(assessmentId, assessment);

    console.log(`Created skill assessment for ${category}`);

    return assessment;
  }

  async awardCertification(
    userId: string,
    category: CourseCategory,
    level: CertificationLevel,
    courseId?: string
  ): Promise<Certification> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error('Education profile not found');
    }

    const certification: Certification = {
      id: crypto.randomUUID(),
      name: `${category.replace('_', ' ')} ${level}`,
      issuer: 'FanzLab University',
      level,
      category,
      earnedAt: new Date(),
      skills: [],
      credentialUrl: `https://fanzlab.com/certificates/${crypto.randomUUID()}`
    };

    profile.certifications.push(certification);

    console.log(`Awarded certification: ${certification.name} to user ${userId}`);
    monitoringService.trackBusinessMetric('certification_awarded', 1, {
      category,
      level,
      userId
    });

    return certification;
  }

  // Analytics and Reporting
  async getInstructorAnalytics(instructorId: string): Promise<{
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
    popularCourses: Course[];
    recentActivity: any[];
  }> {
    const courses = Array.from(this.courses.values()).filter(c => c.instructorId === instructorId);
    
    const analytics = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, course) => sum + course.enrollmentCount, 0),
      totalRevenue: courses.reduce((sum, course) => sum + (course.price * course.enrollmentCount), 0),
      averageRating: courses.reduce((sum, course) => sum + course.averageRating, 0) / courses.length || 0,
      completionRate: 0.85, // Would calculate from actual completion data
      popularCourses: courses.sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 5),
      recentActivity: [] // Would include recent enrollments, reviews, etc.
    };

    return analytics;
  }

  async getLearningPath(
    userId: string,
    goalCategory: CourseCategory,
    targetLevel: SkillLevel
  ): Promise<{
    courses: Course[];
    estimatedDuration: number;
    prerequisites: string[];
    milestones: string[];
  }> {
    const profile = this.profiles.get(userId);
    const currentLevel = profile?.skillLevel || SkillLevel.BEGINNER;

    // Find courses that build towards the goal
    const relevantCourses = Array.from(this.courses.values()).filter(course =>
      course.category === goalCategory && course.isPublished
    );

    // Sort by skill level progression
    const sortedCourses = relevantCourses.sort((a, b) => {
      const levelOrder = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
      return levelOrder.indexOf(a.skillLevel) - levelOrder.indexOf(b.skillLevel);
    });

    // Filter based on current level
    const currentLevelIndex = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT].indexOf(currentLevel);
    const targetLevelIndex = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT].indexOf(targetLevel);

    const pathCourses = sortedCourses.filter((course, index) => {
      const courseLevelIndex = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT].indexOf(course.skillLevel);
      return courseLevelIndex >= currentLevelIndex && courseLevelIndex <= targetLevelIndex;
    });

    return {
      courses: pathCourses.slice(0, 10), // Limit to 10 courses
      estimatedDuration: pathCourses.reduce((sum, course) => sum + course.duration, 0),
      prerequisites: Array.from(new Set(pathCourses.flatMap(course => course.prerequisites))),
      milestones: [
        'Complete foundation courses',
        'Build practical projects',
        'Gain intermediate skills',
        'Master advanced techniques',
        'Achieve certification'
      ]
    };
  }

  // Search and Discovery
  searchCourses(
    query: string,
    filters: {
      category?: CourseCategory;
      skillLevel?: SkillLevel;
      priceRange?: { min: number; max: number };
      duration?: { min: number; max: number };
      rating?: number;
    } = {}
  ): Course[] {
    let courses = Array.from(this.courses.values()).filter(course => course.isPublished);

    // Text search
    if (query) {
      const queryLower = query.toLowerCase();
      courses = courses.filter(course =>
        course.title.toLowerCase().includes(queryLower) ||
        course.description.toLowerCase().includes(queryLower) ||
        course.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    // Apply filters
    if (filters.category) {
      courses = courses.filter(course => course.category === filters.category);
    }

    if (filters.skillLevel) {
      courses = courses.filter(course => course.skillLevel === filters.skillLevel);
    }

    if (filters.priceRange) {
      courses = courses.filter(course =>
        course.price >= filters.priceRange!.min && course.price <= filters.priceRange!.max
      );
    }

    if (filters.duration) {
      courses = courses.filter(course =>
        course.duration >= filters.duration!.min && course.duration <= filters.duration!.max
      );
    }

    if (filters.rating) {
      courses = courses.filter(course => course.averageRating >= filters.rating!);
    }

    return courses;
  }

  // Getters
  getProfile(userId: string): EducationProfile | undefined {
    return this.profiles.get(userId);
  }

  getCourse(courseId: string): Course | undefined {
    return this.courses.get(courseId);
  }

  getSession(sessionId: string): MentorshipSession | undefined {
    return this.sessions.get(sessionId);
  }

  getProgram(programId: string): MentorshipProgram | undefined {
    return this.programs.get(programId);
  }

  getWorkshop(workshopId: string): LiveWorkshop | undefined {
    return this.workshops.get(workshopId);
  }
}

export const educationService = new EducationService();