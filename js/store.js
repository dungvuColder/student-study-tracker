/**
 * store.js - State Management & LocalStorage Persistence
 */

const STORAGE_KEY = 'student_study_tracker_v1';

// Dữ liệu mẫu khởi tạo ban đầu để người dùng có trải nghiệm trực quan ngay
const INITIAL_DATA = {
  courses: [
    {
      id: 'c-101',
      code: 'CS201',
      name: 'Cấu trúc Dữ liệu & Giải thuật',
      credits: 3,
      lecturer: 'TS. Nguyễn Văn An',
      notes: 'Thực hành phòng Lab 302, kiểm tra giữa kỳ vào tuần 9.',
      color: 'indigo',
      totalWeeks: 15,
      currentWeek: 6,
      createdAt: new Date().toISOString()
    },
    {
      id: 'c-102',
      code: 'SE305',
      name: 'Kỹ nghệ Phần mềm nâng cao',
      credits: 4,
      lecturer: 'ThS. Trần Thị Mai',
      notes: 'Đồ án nhóm 4 người xây dựng Web SPA, nộp báo cáo tuần 14.',
      color: 'emerald',
      totalWeeks: 15,
      currentWeek: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 'c-103',
      code: 'DB202',
      name: 'Cơ sở Dữ liệu & SQL',
      credits: 3,
      lecturer: 'PGS. TS. Lê Quang Dũng',
      notes: 'Thiết kế cơ sở dữ liệu bán hàng chuẩn 3NF và tối ưu chỉ mục.',
      color: 'amber',
      totalWeeks: 12,
      currentWeek: 4,
      createdAt: new Date().toISOString()
    }
  ],
  courseTasks: [
    {
      id: 't-1',
      courseId: 'c-101',
      title: 'Cài đặt Cây nhị phân tìm kiếm AVL',
      type: 'assignment',
      deadline: '2026-10-18',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 't-2',
      courseId: 'c-101',
      title: 'Bài tập Giải thuật Dijkstra tìm đường đi ngắn nhất',
      type: 'assignment',
      deadline: '2026-10-25',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 't-3',
      courseId: 'c-102',
      title: 'Thiết kế sơ đồ Use Case và Wireframe UI',
      type: 'project',
      deadline: '2026-10-20',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 't-4',
      courseId: 'c-102',
      title: 'Viết tài liệu đặc tả yêu cầu SRS cho hệ thống',
      type: 'project',
      deadline: '2026-10-30',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 't-5',
      courseId: 'c-103',
      title: 'Viết bài thực hành Trigger và Stored Procedure',
      type: 'assignment',
      deadline: '2026-10-22',
      completed: true,
      createdAt: new Date().toISOString()
    }
  ],
  globalTodos: [
    {
      id: 'gt-1',
      text: 'Ôn tập 2 chương đầu môn Cấu trúc dữ liệu',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'gt-2',
      text: 'Gặp nhóm đồ án lúc 15:00 tại Thư viện',
      priority: 'medium',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'gt-3',
      text: 'Nộp giấy đăng ký đề tài tốt nghiệp',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ],
  documentsMetadata: [
    {
      id: 'doc-seed-1',
      courseId: 'c-101',
      name: 'Giao_trinh_Cau_truc_du_lieu_va_giai_thuat.pdf',
      size: 3450200,
      type: 'application/pdf',
      uploadDate: new Date().toISOString()
    },
    {
      id: 'doc-seed-2',
      courseId: 'c-102',
      name: 'Bieu_mau_SRS_Bao_cao_Ky_nghe_phan_mem.docx',
      size: 1120000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadDate: new Date().toISOString()
    }
  ]
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

class Store {
  constructor() {
    this.data = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        return JSON.parse(JSON.stringify(INITIAL_DATA));
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Lỗi khi đọc LocalStorage, sử dụng dữ liệu mặc định:', e);
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (e) {
      console.error('Lỗi khi lưu LocalStorage:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  // --- QUẢN LÝ MÔN HỌC (COURSES) ---
  getCourses() {
    return this.data.courses;
  }

  getCourseById(id) {
    return this.data.courses.find(c => c.id === id);
  }

  addCourse({ code, name, credits, lecturer, notes, color, totalWeeks, currentWeek }) {
    const parsedTotalWeeks = Math.max(1, parseInt(totalWeeks, 10) || 15);
    const parsedCurrentWeek = Math.max(1, Math.min(parseInt(currentWeek, 10) || 1, parsedTotalWeeks));

    const newCourse = {
      id: uid('c'),
      code: code ? code.trim().toUpperCase() : 'HP-' + Math.floor(Math.random() * 900 + 100),
      name: name.trim(),
      credits: parseInt(credits, 10) || 3,
      lecturer: lecturer ? lecturer.trim() : 'Chưa cập nhật',
      notes: notes ? notes.trim() : '',
      color: color || ['indigo', 'emerald', 'amber', 'rose', 'blue', 'purple'][Math.floor(Math.random() * 6)],
      totalWeeks: parsedTotalWeeks,
      currentWeek: parsedCurrentWeek,
      createdAt: new Date().toISOString()
    };
    this.data.courses.unshift(newCourse);
    this.save();
    return newCourse;
  }

  updateCourse(id, updatedFields) {
    const index = this.data.courses.findIndex(c => c.id === id);
    if (index !== -1) {
      const existing = this.data.courses[index];
      const totalWeeks = updatedFields.totalWeeks !== undefined ? Math.max(1, parseInt(updatedFields.totalWeeks, 10) || 15) : (existing.totalWeeks || 15);
      const currentWeek = updatedFields.currentWeek !== undefined ? Math.max(1, Math.min(parseInt(updatedFields.currentWeek, 10) || 1, totalWeeks)) : (existing.currentWeek || 1);

      this.data.courses[index] = {
        ...existing,
        ...updatedFields,
        credits: parseInt(updatedFields.credits, 10) || existing.credits,
        totalWeeks,
        currentWeek
      };
      this.save();
      return this.data.courses[index];
    }
    return null;
  }

  // --- TÍNH TOÁN TIẾN TRÌNH TUẦN HỌC ---
  getCourseWeekProgress(courseId) {
    const course = this.getCourseById(courseId);
    if (!course) return { currentWeek: 1, totalWeeks: 15, remainingWeeks: 14, percent: 0 };
    const totalWeeks = Math.max(1, course.totalWeeks || 15);
    const currentWeek = Math.max(1, Math.min(course.currentWeek || 1, totalWeeks));
    const remainingWeeks = Math.max(0, totalWeeks - currentWeek);
    const percent = Math.min(100, Math.round((currentWeek / totalWeeks) * 100));
    return {
      currentWeek,
      totalWeeks,
      remainingWeeks,
      percent
    };
  }

  updateCourseWeek(courseId, delta) {
    const course = this.getCourseById(courseId);
    if (!course) return null;
    const totalWeeks = Math.max(1, course.totalWeeks || 15);
    let newWeek = (course.currentWeek || 1) + delta;
    if (newWeek < 1) newWeek = 1;
    if (newWeek > totalWeeks) newWeek = totalWeeks;
    course.currentWeek = newWeek;
    this.save();
    return course;
  }

  deleteCourse(id) {
    // Xóa môn học đồng thời xóa các công việc và tài liệu liên quan
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.data.courseTasks = this.data.courseTasks.filter(t => t.courseId !== id);
    this.data.documentsMetadata = this.data.documentsMetadata.filter(d => d.courseId !== id);
    this.save();
  }

  // --- TÍNH TIẾN ĐỘ BÀI TẬP CỦA MÔN HỌC ---
  getCourseProgress(courseId) {
    const tasks = this.data.courseTasks.filter(t => t.courseId === courseId);
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(t => t.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  }

  // Thống kê tổng quan toàn hệ thống
  getStats() {
    const totalCourses = this.data.courses.length;
    const totalCredits = this.data.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
    const totalCourseTasks = this.data.courseTasks.length;
    const completedCourseTasks = this.data.courseTasks.filter(t => t.completed).length;
    const overallProgress = totalCourseTasks === 0 ? 0 : Math.round((completedCourseTasks / totalCourseTasks) * 100);

    const pendingGlobalTodos = this.data.globalTodos.filter(t => !t.completed).length;
    const totalDocs = this.data.documentsMetadata.length;

    return {
      totalCourses,
      totalCredits,
      totalCourseTasks,
      completedCourseTasks,
      overallProgress,
      pendingGlobalTodos,
      totalDocs
    };
  }

  // --- QUẢN LÝ CÔNG VIỆC THEO MÔN (COURSE TASKS) ---
  getTasksByCourse(courseId) {
    return this.data.courseTasks.filter(t => t.courseId === courseId);
  }

  addCourseTask({ courseId, title, type, deadline }) {
    const newTask = {
      id: uid('t'),
      courseId,
      title: title.trim(),
      type: type || 'assignment',
      deadline: deadline || '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.data.courseTasks.push(newTask);
    this.save();
    return newTask;
  }

  toggleCourseTask(id) {
    const task = this.data.courseTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      return task;
    }
    return null;
  }

  deleteCourseTask(id) {
    this.data.courseTasks = this.data.courseTasks.filter(t => t.id !== id);
    this.save();
  }

  // --- QUẢN LÝ TO-DO LIST TOÀN CỤC (GLOBAL TODOS) ---
  getGlobalTodos() {
    return this.data.globalTodos;
  }

  addGlobalTodo(text, priority = 'medium') {
    if (!text || !text.trim()) return null;
    const newTodo = {
      id: uid('gt'),
      text: text.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.data.globalTodos.unshift(newTodo);
    this.save();
    return newTodo;
  }

  toggleGlobalTodo(id) {
    const todo = this.data.globalTodos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.save();
      return todo;
    }
    return null;
  }

  deleteGlobalTodo(id) {
    this.data.globalTodos = this.data.globalTodos.filter(t => t.id !== id);
    this.save();
  }

  // --- QUẢN LÝ SIÊU DỮ LIỆU TÀI LIỆU (DOCUMENTS METADATA) ---
  getDocumentsByCourse(courseId) {
    return this.data.documentsMetadata.filter(d => d.courseId === courseId);
  }

  getAllDocuments() {
    return this.data.documentsMetadata;
  }

  addDocumentMetadata({ id, courseId, name, size, type }) {
    const newDoc = {
      id,
      courseId,
      name,
      size,
      type,
      uploadDate: new Date().toISOString()
    };
    this.data.documentsMetadata.unshift(newDoc);
    this.save();
    return newDoc;
  }

  deleteDocumentMetadata(id) {
    this.data.documentsMetadata = this.data.documentsMetadata.filter(d => d.id !== id);
    this.save();
  }
}

// Khởi tạo instance toàn cục
window.store = new Store();
