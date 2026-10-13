/**
 * app.js - Main Application Controller
 */

class App {
  constructor() {
    this.currentEditingCourseId = null;
    this.activeCourseId = null;
  }

  init() {
    console.log('Khởi động Hệ thống Quản lý và Theo dõi Học tập Sinh viên...');

    // Đăng ký listener khi store cập nhật dữ liệu
    window.store.subscribe(() => {
      this.refreshAll();
    });

    // Gắn các sự kiện form & buttons
    this.bindEvents();

    // Khởi tạo IndexedDB
    window.docDB.init().catch(err => console.warn('IndexedDB Init warning:', err));

    // Render ban đầu
    this.refreshAll();
  }

  refreshAll() {
    window.UI.renderStats();
    window.UI.renderCoursesList();
    window.UI.renderGlobalTodos();
    this.renderAllDocumentsView();

    // Nếu đang mở modal chi tiết của một môn, cập nhật lại modal đó luôn
    if (this.activeCourseId) {
      window.UI.renderCourseDetailModal(this.activeCourseId);
    }
  }

  bindEvents() {
    // 1. Form Thêm / Sửa môn học
    const courseForm = document.getElementById('course-form');
    if (courseForm) {
      courseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCourse();
      });
    }

    // 2. Form Thêm To-do toàn cục
    const todoForm = document.getElementById('global-todo-form');
    if (todoForm) {
      todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('global-todo-input');
        const prioritySelect = document.getElementById('global-todo-priority');
        const text = input.value.trim();
        if (text) {
          window.store.addGlobalTodo(text, prioritySelect ? prioritySelect.value : 'medium');
          input.value = '';
          window.UI.showToast('Đã thêm ghi chú việc cần làm!', 'success');
        }
      });
    }

    // 3. Form Thêm bài tập cho môn học
    const taskForm = document.getElementById('add-task-form');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddTask();
      });
    }

    // 4. Input Upload tài liệu
    const fileInput = document.getElementById('document-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files);
      });
    }

    // Drag and drop zone upload
    const dropZone = document.getElementById('upload-dropzone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-50/50');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFileUpload(e.dataTransfer.files);
        }
      });
    }

    // 5. Ô tìm kiếm môn học
    const searchInput = document.getElementById('search-courses');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterCourses(e.target.value);
      });
    }

    // Phím tắt ESC để đóng modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // --- QUẢN LÝ MÔN HỌC ---
  openCourseModal(isEdit = false) {
    this.currentEditingCourseId = isEdit ? this.currentEditingCourseId : null;
    const modal = document.getElementById('course-modal');
    const title = document.getElementById('course-modal-title');
    const form = document.getElementById('course-form');

    if (!modal) return;

    if (isEdit && this.currentEditingCourseId) {
      title.innerText = 'Chỉnh Sửa Môn Học';
      const course = window.store.getCourseById(this.currentEditingCourseId);
      if (course) {
        document.getElementById('course-code').value = course.code;
        document.getElementById('course-name').value = course.name;
        document.getElementById('course-credits').value = course.credits;
        document.getElementById('course-lecturer').value = course.lecturer;
        document.getElementById('course-notes').value = course.notes || '';
        document.getElementById('course-color').value = course.color || 'indigo';
        document.getElementById('course-total-weeks').value = course.totalWeeks || 15;
        document.getElementById('course-current-week').value = course.currentWeek || 1;
      }
    } else {
      title.innerText = 'Thêm Môn Học Mới';
      form.reset();
      document.getElementById('course-color').value = 'indigo';
      document.getElementById('course-total-weeks').value = 15;
      document.getElementById('course-current-week').value = 1;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('course-name').focus();
  }

  closeCourseModal() {
    const modal = document.getElementById('course-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  handleSaveCourse() {
    const code = document.getElementById('course-code').value.trim();
    const name = document.getElementById('course-name').value.trim();
    const credits = document.getElementById('course-credits').value;
    const lecturer = document.getElementById('course-lecturer').value.trim();
    const notes = document.getElementById('course-notes').value.trim();
    const color = document.getElementById('course-color').value;
    const totalWeeks = document.getElementById('course-total-weeks').value;
    const currentWeek = document.getElementById('course-current-week').value;

    if (!name) {
      window.UI.showToast('Vui lòng nhập tên môn học!', 'warning');
      return;
    }

    if (this.currentEditingCourseId) {
      window.store.updateCourse(this.currentEditingCourseId, {
        code, name, credits, lecturer, notes, color, totalWeeks, currentWeek
      });
      window.UI.showToast('Cập nhật môn học thành công!', 'success');
    } else {
      window.store.addCourse({
        code, name, credits, lecturer, notes, color, totalWeeks, currentWeek
      });
      window.UI.showToast('Thêm môn học mới thành công!', 'success');
    }

    this.closeCourseModal();
  }

  stepCourseWeek(courseId, delta) {
    const updated = window.store.updateCourseWeek(courseId, delta);
    if (updated) {
      const remaining = Math.max(0, updated.totalWeeks - updated.currentWeek);
      window.UI.showToast(`Đã chuyển sang Tuần ${updated.currentWeek}/${updated.totalWeeks} (Còn ${remaining} tuần)`, 'info');
    }
  }

  stepCurrentDetailWeek(delta) {
    if (!this.activeCourseId) return;
    this.stepCourseWeek(this.activeCourseId, delta);
    window.UI.renderCourseDetailModal(this.activeCourseId);
  }

  editCourse(id) {
    this.currentEditingCourseId = id;
    this.openCourseModal(true);
  }

  confirmDeleteCourse(id) {
    const course = window.store.getCourseById(id);
    if (!course) return;

    if (confirm(`Bạn có chắc muốn xóa môn "${course.name}" (${course.code}) không?\nTất cả bài tập và tài liệu thuộc môn này cũng sẽ bị xóa.`)) {
      window.store.deleteCourse(id);
      window.UI.showToast(`Đã xóa môn ${course.name}!`, 'info');
      if (this.activeCourseId === id) {
        this.closeCourseDetailModal();
      }
    }
  }

  filterCourses(query) {
    const term = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#courses-grid > div');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      if (text.includes(term)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // --- CHI TIẾT MÔN HỌC ---
  openCourseDetail(courseId) {
    this.activeCourseId = courseId;
    window.UI.renderCourseDetailModal(courseId);

    const modal = document.getElementById('course-detail-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closeCourseDetailModal() {
    this.activeCourseId = null;
    const modal = document.getElementById('course-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  // --- CÔNG VIỆC THEO MÔN (TASKS) ---
  handleAddTask() {
    if (!this.activeCourseId) return;

    const titleInput = document.getElementById('task-title-input');
    const typeSelect = document.getElementById('task-type-select');
    const deadlineInput = document.getElementById('task-deadline-input');

    const title = titleInput.value.trim();
    if (!title) {
      window.UI.showToast('Vui lòng nhập tên bài tập/đầu việc!', 'warning');
      return;
    }

    window.store.addCourseTask({
      courseId: this.activeCourseId,
      title,
      type: typeSelect ? typeSelect.value : 'assignment',
      deadline: deadlineInput ? deadlineInput.value : ''
    });

    titleInput.value = '';
    if (deadlineInput) deadlineInput.value = '';

    window.UI.showToast('Đã thêm bài tập mới!', 'success');
  }

  toggleCourseTask(taskId, courseId) {
    window.store.toggleCourseTask(taskId);
    window.UI.renderCourseDetailModal(courseId);
  }

  deleteCourseTask(taskId, courseId) {
    window.store.deleteCourseTask(taskId);
    window.UI.renderCourseDetailModal(courseId);
    window.UI.showToast('Đã xóa bài tập!', 'info');
  }

  // --- TO-DO TOÀN CỤC ---
  toggleGlobalTodo(id) {
    window.store.toggleGlobalTodo(id);
    window.UI.renderGlobalTodos();
    window.UI.renderStats();
  }

  deleteGlobalTodo(id) {
    window.store.deleteGlobalTodo(id);
    window.UI.renderGlobalTodos();
    window.UI.renderStats();
  }

  // --- QUẢN LÝ TÀI LIỆU & INDEXEDDB FILE STORAGE ---
  async handleFileUpload(files) {
    if (!files || files.length === 0) return;
    if (!this.activeCourseId) {
      window.UI.showToast('Vui lòng chọn môn học trước khi upload tài liệu!', 'warning');
      return;
    }

    const courseId = this.activeCourseId;
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

      try {
        // Lưu nội dung file (Blob) vào IndexedDB
        await window.docDB.saveFile({
          id: docId,
          courseId: courseId,
          name: file.name,
          size: file.size,
          type: file.type,
          blob: file,
          uploadDate: new Date().toISOString()
        });

        // Lưu metadata vào LocalStorage store
        window.store.addDocumentMetadata({
          id: docId,
          courseId: courseId,
          name: file.name,
          size: file.size,
          type: file.type
        });

        uploadedCount++;
      } catch (err) {
        console.error('Lỗi khi lưu file vào IndexedDB:', err);
      }
    }

    if (uploadedCount > 0) {
      window.UI.showToast(`Đã tải lên thành công ${uploadedCount} tài liệu!`, 'success');
      window.UI.renderCourseDocuments(courseId);
      this.renderAllDocumentsView();
    }

    // Reset input file
    const fileInput = document.getElementById('document-file-input');
    if (fileInput) fileInput.value = '';
  }

  async downloadDocument(docId) {
    try {
      const fileRecord = await window.docDB.getFile(docId);
      let blob = fileRecord ? fileRecord.blob : null;
      let fileName = fileRecord ? fileRecord.name : 'tai-lieu.txt';

      // Nếu là tài liệu mẫu khởi tạo chưa có blob trong IndexedDB, tạo blob mẫu text
      if (!blob) {
        const meta = window.store.getAllDocuments().find(d => d.id === docId);
        if (meta) {
          fileName = meta.name;
          const dummyContent = `Tài liệu: ${meta.name}\nĐược quản lý bởi: Hệ thống Quản lý và Theo dõi Học tập Sinh viên\nNgày tải: ${meta.uploadDate || new Date().toISOString()}`;
          blob = new Blob([dummyContent], { type: meta.type || 'text/plain' });
        }
      }

      if (!blob) {
        window.UI.showToast('Không tìm thấy nội dung file!', 'error');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.UI.showToast(`Đang tải xuống "${fileName}"...`, 'success');
    } catch (err) {
      console.error('Lỗi khi tải file:', err);
      window.UI.showToast('Lỗi khi tải file từ bộ nhớ cục bộ!', 'error');
    }
  }

  async deleteDocument(docId, courseId) {
    if (confirm('Bạn có chắc muốn xóa tài liệu này không?')) {
      try {
        await window.docDB.deleteFile(docId);
      } catch (e) {
        console.warn('Xóa từ IndexedDB warning:', e);
      }
      window.store.deleteDocumentMetadata(docId);
      window.UI.renderCourseDocuments(courseId);
      this.renderAllDocumentsView();
      window.UI.showToast('Đã xóa tài liệu!', 'info');
    }
  }

  // Render view "Kho tài liệu tổng hợp"
  renderAllDocumentsView() {
    const container = document.getElementById('all-docs-tbody');
    const countBadge = document.getElementById('all-docs-count');
    if (!container) return;

    const docs = window.store.getAllDocuments();
    if (countBadge) countBadge.innerText = `${docs.length} tệp`;

    if (docs.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400">
            <i class="fa-regular fa-folder-open text-2xl mb-2 block"></i>
            Chưa có tài liệu nào trong toàn bộ hệ thống.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = docs.map(doc => {
      const course = window.store.getCourseById(doc.courseId);
      const courseName = course ? `${course.code} - ${course.name}` : 'Môn học khác';

      return `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100 text-xs">
          <td class="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
            <i class="fa-regular fa-file text-indigo-500"></i>
            <span class="truncate max-w-[200px]" title="${doc.name}">${doc.name}</span>
          </td>
          <td class="py-3 px-4 text-slate-600 font-medium">
            <span class="bg-slate-100 px-2 py-0.5 rounded text-[11px]">${courseName}</span>
          </td>
          <td class="py-3 px-4 text-slate-400 font-mono">${window.UI.formatBytes(doc.size)}</td>
          <td class="py-3 px-4 text-slate-400">${window.UI.formatDate(doc.uploadDate)}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.app.downloadDocument('${doc.id}')" class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Tải về">
                <i class="fa-solid fa-download"></i>
              </button>
              <button onclick="window.app.deleteDocument('${doc.id}', '${doc.courseId}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Xóa">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Chuyển Tab giữa "Tổng quan & Môn học" và "Kho tài liệu"
  switchTab(tabName) {
    const tabDashboard = document.getElementById('tab-view-dashboard');
    const tabDocs = document.getElementById('tab-view-docs');
    const btnDashboard = document.getElementById('nav-btn-dashboard');
    const btnDocs = document.getElementById('nav-btn-docs');

    if (tabName === 'dashboard') {
      if (tabDashboard) tabDashboard.classList.remove('hidden');
      if (tabDocs) tabDocs.classList.add('hidden');
      btnDashboard?.classList.add('bg-indigo-50', 'text-indigo-600', 'font-bold');
      btnDashboard?.classList.remove('text-slate-600');
      btnDocs?.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-bold');
      btnDocs?.classList.add('text-slate-600');
    } else {
      if (tabDashboard) tabDashboard.classList.add('hidden');
      if (tabDocs) tabDocs.classList.remove('hidden');
      btnDocs?.classList.add('bg-indigo-50', 'text-indigo-600', 'font-bold');
      btnDocs?.classList.remove('text-slate-600');
      btnDashboard?.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-bold');
      btnDashboard?.classList.add('text-slate-600');
    }
  }

  closeAllModals() {
    this.closeCourseModal();
    this.closeCourseDetailModal();
  }
}

// Khởi tạo app
window.app = new App();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
