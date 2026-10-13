/**
 * ui.js - Render Components, Modals, Toasts, Progress Bars
 */

const UI = {
  // Bảng màu cho từng môn học
  colorMap: {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-600', badge: 'bg-purple-100 text-purple-800' }
  },

  getColor(colorName) {
    return this.colorMap[colorName] || this.colorMap.indigo;
  },

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  },

  // Hiển thị thông báo Toast
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-600 text-white' :
               type === 'error' ? 'bg-rose-600 text-white' :
               type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white';

    const icon = type === 'success' ? 'fa-circle-check' :
                 type === 'error' ? 'fa-circle-exclamation' :
                 type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

    toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bg} text-sm font-medium z-50 pointer-events-auto transition-all`;
    toast.innerHTML = `
      <i class="fa-solid ${icon} text-base"></i>
      <span class="flex-1">${message}</span>
      <button class="opacity-75 hover:opacity-100 ml-2" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // Render các số liệu thống kê ở đầu Dashboard
  renderStats() {
    const stats = window.store.getStats();

    const statTotalCourses = document.getElementById('stat-total-courses');
    const statTotalCredits = document.getElementById('stat-total-credits');
    const statOverallProgress = document.getElementById('stat-overall-progress');
    const statPendingTodos = document.getElementById('stat-pending-todos');
    const statProgressBar = document.getElementById('stat-overall-progressbar');

    if (statTotalCourses) statTotalCourses.innerText = stats.totalCourses;
    if (statTotalCredits) statTotalCredits.innerText = stats.totalCredits;
    if (statOverallProgress) statOverallProgress.innerText = `${stats.overallProgress}%`;
    if (statPendingTodos) statPendingTodos.innerText = stats.pendingGlobalTodos;
    if (statProgressBar) statProgressBar.style.width = `${stats.overallProgress}%`;
  },

  // Render danh sách thẻ Môn học
  renderCoursesList() {
    const container = document.getElementById('courses-grid');
    if (!container) return;

    const courses = window.store.getCourses();

    if (courses.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl">
            <i class="fa-solid fa-book-open"></i>
          </div>
          <h3 class="text-base font-semibold text-slate-800">Chưa có môn học nào</h3>
          <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Bấm nút "Thêm Môn Học Mới" ở góc trên để bắt đầu theo dõi tiến độ học tập của bạn.</p>
          <button onclick="window.app.openCourseModal()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
            <i class="fa-solid fa-plus mr-1.5"></i> Thêm môn đầu tiên
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = courses.map(course => {
      const progress = window.store.getCourseProgress(course.id);
      const weekInfo = window.store.getCourseWeekProgress(course.id);
      const tasks = window.store.getTasksByCourse(course.id);
      const completedTasks = tasks.filter(t => t.completed).length;
      const docs = window.store.getDocumentsByCourse(course.id);
      const color = this.getColor(course.color);

      // Nhãn trạng thái thời gian
      let weekStatusBadge = '';
      if (weekInfo.remainingWeeks === 0) {
        weekStatusBadge = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Đã hết tuần học</span>';
      } else if (weekInfo.remainingWeeks <= 2) {
        weekStatusBadge = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 animate-pulse">Sắp thi cuối kỳ</span>';
      }

      return `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm card-hover-effect flex flex-col justify-between">
          <div>
            <!-- Header thẻ môn -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-md text-xs font-bold ${color.badge}">
                  ${course.code}
                </span>
                <span class="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                  <i class="fa-solid fa-graduation-cap text-slate-600 mr-1"></i>${course.credits} Tín chỉ
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button onclick="window.app.editCourse('${course.id}')" title="Sửa môn học" class="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition">
                  <i class="fa-regular fa-pen-to-square text-sm"></i>
                </button>
                <button onclick="window.app.confirmDeleteCourse('${course.id}')" title="Xóa môn học" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition">
                  <i class="fa-regular fa-trash-can text-sm"></i>
                </button>
              </div>
            </div>

            <!-- Tên môn & Giảng viên -->
            <h3 class="text-base font-bold text-slate-800 line-clamp-2 hover:text-indigo-600 cursor-pointer" onclick="window.app.openCourseDetail('${course.id}')">
              ${course.name}
            </h3>
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-chalkboard-user text-slate-400"></i> ${course.lecturer || 'Chưa có thông tin GV'}
            </p>

            ${course.notes ? `
              <p class="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-3 line-clamp-2 border border-slate-100">
                <i class="fa-regular fa-note-sticky text-slate-400 mr-1"></i> ${course.notes}
              </p>
            ` : ''}

            <!-- 1. Thanh Tiến trình Thời gian Môn học (Theo Tuần) -->
            <div class="mt-4 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span class="text-slate-600 flex items-center gap-1">
                  <i class="fa-regular fa-calendar-days text-indigo-500"></i> Thời gian môn học:
                </span>
                <div class="flex items-center gap-1">
                  ${weekStatusBadge}
                  <span class="text-slate-800 font-bold">Tuần ${weekInfo.currentWeek}/${weekInfo.totalWeeks}</span>
                </div>
              </div>

              <!-- Thanh progress bar thời gian -->
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${weekInfo.percent}%"></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span class="font-medium">
                  Còn lại: <strong class="${weekInfo.remainingWeeks <= 2 ? 'text-rose-600' : 'text-indigo-600'}">${weekInfo.remainingWeeks} tuần</strong> (${weekInfo.percent}% thời gian)
                </span>
                <div class="flex items-center gap-1">
                  <button onclick="event.stopPropagation(); window.app.stepCourseWeek('${course.id}', -1)" title="Lùi 1 tuần" class="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center justify-center font-bold text-xs transition">
                    -
                  </button>
                  <button onclick="event.stopPropagation(); window.app.stepCourseWeek('${course.id}', 1)" title="Tăng 1 tuần" class="w-5 h-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold text-xs transition">
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. Tiến độ Bài tập & Đồ án -->
            <div class="mt-3 pt-2.5 border-t border-dashed border-slate-100">
              <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span class="text-slate-600 flex items-center gap-1">
                  <i class="fa-solid fa-chart-line text-emerald-500"></i> Tiến độ bài tập:
                </span>
                <span class="text-slate-800 font-bold">${progress}%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="${color.bar} h-full rounded-full transition-all duration-500" style="width: ${progress}%"></div>
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Đã nộp: <b>${completedTasks}/${tasks.length}</b> bài tập</span>
                <span class="flex items-center gap-1"><i class="fa-regular fa-folder text-slate-400"></i> ${docs.length} tài liệu</span>
              </div>
            </div>
          </div>

          <!-- Nút hành động xem chi tiết -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onclick="window.app.openCourseDetail('${course.id}')" class="w-full py-2 px-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
              <span>Xem bài tập & tài liệu</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Widget To-do List Toàn Cục (Daily Tasks)
  renderGlobalTodos() {
    const container = document.getElementById('global-todos-list');
    const badge = document.getElementById('global-todos-count');
    if (!container) return;

    const todos = window.store.getGlobalTodos();
    const pendingCount = todos.filter(t => !t.completed).length;
    if (badge) badge.innerText = `${pendingCount} việc`;

    if (todos.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <i class="fa-regular fa-calendar-check text-2xl mb-2 block"></i>
          <p class="text-xs">Không có việc cần làm hôm nay. Tuyệt vời!</p>
        </div>
      `;
      return;
    }

    const priorityBadge = {
      high: '<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Gấp</span>',
      medium: '<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Vừa</span>',
      low: '<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Thấp</span>'
    };

    container.innerHTML = todos.map(todo => `
      <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group">
        <label class="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="window.app.toggleGlobalTodo('${todo.id}')" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300">
          <span class="text-xs font-medium ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}">
            ${todo.text}
          </span>
        </label>
        <div class="flex items-center gap-1.5">
          ${priorityBadge[todo.priority] || ''}
          <button onclick="window.app.deleteGlobalTodo('${todo.id}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 text-xs transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  // Render Modal Chi tiết Môn học (Gồm việc cần làm & Tài liệu)
  renderCourseDetailModal(courseId) {
    const course = window.store.getCourseById(courseId);
    if (!course) return;

    const modalTitle = document.getElementById('detail-modal-title');
    const modalCode = document.getElementById('detail-modal-code');
    const modalLecturer = document.getElementById('detail-modal-lecturer');
    const modalCredits = document.getElementById('detail-modal-credits');
    const modalNotes = document.getElementById('detail-modal-notes');
    const modalProgressText = document.getElementById('detail-modal-progress-text');
    const modalProgressBar = document.getElementById('detail-modal-progress-bar');
    const modalWeekText = document.getElementById('detail-modal-week-text');
    const modalWeekBar = document.getElementById('detail-modal-week-bar');

    const progress = window.store.getCourseProgress(courseId);
    const weekInfo = window.store.getCourseWeekProgress(courseId);
    const color = this.getColor(course.color);

    if (modalTitle) modalTitle.innerText = course.name;
    if (modalCode) {
      modalCode.innerText = course.code;
      modalCode.className = `px-2 py-0.5 rounded-md text-xs font-bold ${color.badge}`;
    }
    if (modalLecturer) modalLecturer.innerText = course.lecturer;
    if (modalCredits) modalCredits.innerText = `${course.credits} Tín chỉ`;
    if (modalNotes) modalNotes.innerText = course.notes || 'Không có ghi chú thêm.';
    
    // Cập nhật tiến độ bài tập
    if (modalProgressText) modalProgressText.innerText = `${progress}% Hoàn thành`;
    if (modalProgressBar) {
      modalProgressBar.style.width = `${progress}%`;
      modalProgressBar.className = `${color.bar} h-full rounded-full transition-all duration-300`;
    }

    // Cập nhật tiến độ tuần học
    if (modalWeekText) {
      modalWeekText.innerHTML = `Tuần <b>${weekInfo.currentWeek}/${weekInfo.totalWeeks}</b> (Còn <strong>${weekInfo.remainingWeeks} tuần</strong> - ${weekInfo.percent}%)`;
    }
    if (modalWeekBar) {
      modalWeekBar.style.width = `${weekInfo.percent}%`;
    }

    // Render danh sách task của môn này
    this.renderCourseTasks(courseId);

    // Render danh sách tài liệu của môn này
    this.renderCourseDocuments(courseId);

    // Lưu activeCourseId vào dataset của modal
    document.getElementById('course-detail-modal').dataset.courseId = courseId;
  },

  // Render Bài tập/Đồ án theo Môn (Course Tasks)
  renderCourseTasks(courseId) {
    const container = document.getElementById('course-tasks-list');
    if (!container) return;

    const tasks = window.store.getTasksByCourse(courseId);

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <i class="fa-solid fa-list-check text-2xl mb-1 text-slate-300"></i>
          <p class="text-xs">Chưa có bài tập hoặc đồ án nào cho môn học này.</p>
          <p class="text-[11px] text-slate-400">Hãy thêm bài tập mới để theo dõi % tiến độ.</p>
        </div>
      `;
      return;
    }

    const typeLabels = {
      assignment: '<span class="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Bài tập</span>',
      project: '<span class="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">Đồ án</span>',
      reading: '<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Đọc tài liệu</span>',
      exam: '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Ôn thi</span>'
    };

    container.innerHTML = tasks.map(task => `
      <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 transition">
        <label class="flex items-center gap-3 flex-1 cursor-pointer">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window.app.toggleCourseTask('${task.id}', '${courseId}')" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer">
          <div>
            <div class="text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}">
              ${task.title}
            </div>
            <div class="flex items-center gap-2 mt-1">
              ${typeLabels[task.type] || ''}
              ${task.deadline ? `
                <span class="text-[11px] text-slate-400 flex items-center gap-1">
                  <i class="fa-regular fa-clock text-[10px]"></i> Hạn nộp: ${this.formatDate(task.deadline)}
                </span>
              ` : ''}
            </div>
          </div>
        </label>
        <button onclick="window.app.deleteCourseTask('${task.id}', '${courseId}')" class="text-slate-300 hover:text-rose-500 p-2 text-sm transition" title="Xóa">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `).join('');
  },

  // Render Danh sách Tài liệu theo Môn (Documents)
  renderCourseDocuments(courseId) {
    const container = document.getElementById('course-docs-list');
    if (!container) return;

    const docs = window.store.getDocumentsByCourse(courseId);

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <i class="fa-regular fa-file-lines text-2xl mb-1 text-slate-300"></i>
          <p class="text-xs">Chưa có tài liệu nào được tải lên.</p>
          <p class="text-[11px] text-slate-400">Chọn file bên dưới để tải tài liệu lên lưu trữ nội bộ.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = docs.map(doc => {
      let icon = 'fa-file-lines text-indigo-500';
      if (doc.type && doc.type.includes('pdf')) icon = 'fa-file-pdf text-rose-500';
      else if (doc.type && (doc.type.includes('word') || doc.type.includes('document'))) icon = 'fa-file-word text-blue-600';
      else if (doc.type && doc.type.includes('image')) icon = 'fa-file-image text-emerald-500';
      else if (doc.type && doc.type.includes('zip')) icon = 'fa-file-zipper text-amber-500';

      return `
        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-base">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div class="overflow-hidden">
              <div class="text-xs font-bold text-slate-800 truncate" title="${doc.name}">${doc.name}</div>
              <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>${this.formatBytes(doc.size)}</span>
                <span>•</span>
                <span>${this.formatDate(doc.uploadDate)}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0 ml-2">
            <button onclick="window.app.downloadDocument('${doc.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition" title="Tải xuống">
              <i class="fa-solid fa-download"></i> Tải về
            </button>
            <button onclick="window.app.deleteDocument('${doc.id}', '${courseId}')" class="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center transition" title="Xóa tài liệu">
              <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.UI = UI;
