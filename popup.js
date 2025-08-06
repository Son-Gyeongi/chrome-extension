class SimpleNotepad {
   constructor() {
      this.notes = [];
      this.currentNoteId = null;
      this.isEditing = false;
      this.currentTheme = "light";

      this.initElements();
      this.bindEvents();
      this.loadNotes();
      this.loadTheme();
      this.renderNotes();
   }

   initElements() {
      this.newNoteBtn = document.getElementById("newNoteBtn");
      this.searchInput = document.getElementById("searchInput");
      this.notesContainer = document.getElementById("notesContainer");
      this.noteEditor = document.getElementById("noteEditor");
      this.noteTitle = document.getElementById("noteTitle");
      this.noteContent = document.getElementById("noteContent");
      this.saveNoteBtn = document.getElementById("saveNoteBtn");
      this.cancelNoteBtn = document.getElementById("cancelNoteBtn");
      this.themeToggleBtn = document.getElementById("themeToggleBtn");
   }

   bindEvents() {
      this.newNoteBtn.addEventListener("click", () => this.createNewNote());
      this.searchInput.addEventListener("input", (e) =>
         this.searchNotes(e.target.value)
      );
      this.saveNoteBtn.addEventListener("click", () => this.saveNote());
      this.cancelNoteBtn.addEventListener("click", () => this.cancelEdit());
      this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

      // 자동 저장 기능
      this.noteTitle.addEventListener("input", () => this.autoSave());
      this.noteContent.addEventListener("input", () => this.autoSave());
   }

   async loadNotes() {
      try {
         const result = await chrome.storage.local.get(["notes"]);
         this.notes = result.notes || [];
      } catch (error) {
         console.error("메모 로드 실패:", error);
         this.notes = [];
      }
   }

   async saveNotes() {
      try {
         await chrome.storage.local.set({ notes: this.notes });
      } catch (error) {
         console.error("메모 저장 실패:", error);
      }
   }

   async loadTheme() {
      try {
         const result = await chrome.storage.local.get(["theme"]);
         this.currentTheme = result.theme || "light";
         this.applyTheme();
      } catch (error) {
         console.error("테마 로드 실패:", error);
         this.currentTheme = "light";
         this.applyTheme();
      }
   }

   async saveTheme() {
      try {
         await chrome.storage.local.set({ theme: this.currentTheme });
      } catch (error) {
         console.error("테마 저장 실패:", error);
      }
   }

   toggleTheme() {
      this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
      this.applyTheme();
      this.saveTheme();
   }

   applyTheme() {
      document.documentElement.setAttribute("data-theme", this.currentTheme);
      this.updateThemeButton();
   }

   updateThemeButton() {
      if (this.currentTheme === "dark") {
         this.themeToggleBtn.textContent = "☀️";
         this.themeToggleBtn.title = "라이트모드로 전환";
      } else {
         this.themeToggleBtn.textContent = "🌙";
         this.themeToggleBtn.title = "다크모드로 전환";
      }
   }

   createNewNote() {
      this.currentNoteId = Date.now().toString();
      this.isEditing = true;

      this.noteTitle.value = "";
      this.noteContent.value = "";

      this.showEditor();
      this.noteTitle.focus();
   }

   editNote(noteId) {
      const note = this.notes.find((n) => n.id === noteId);
      if (!note) return;

      this.currentNoteId = noteId;
      this.isEditing = true;

      this.noteTitle.value = note.title;
      this.noteContent.value = note.content;

      this.showEditor();
      this.noteTitle.focus();
   }

   async saveNote() {
      const title = this.noteTitle.value.trim();
      const content = this.noteContent.value.trim();

      if (!title && !content) {
         this.cancelEdit();
         return;
      }

      const noteData = {
         id: this.currentNoteId,
         title: title || "제목 없음",
         content: content,
         createdAt: this.isEditing
            ? this.notes.find((n) => n.id === this.currentNoteId)?.createdAt ||
              Date.now()
            : Date.now(),
         updatedAt: Date.now(),
      };

      const existingIndex = this.notes.findIndex(
         (n) => n.id === this.currentNoteId
      );

      if (existingIndex >= 0) {
         this.notes[existingIndex] = noteData;
      } else {
         this.notes.unshift(noteData);
      }

      await this.saveNotes();
      this.renderNotes();
      this.hideEditor();
      this.resetState();
   }

   async deleteNote(noteId, event) {
      event.stopPropagation();

      if (confirm("정말로 이 메모를 삭제하시겠습니까?")) {
         this.notes = this.notes.filter((n) => n.id !== noteId);
         await this.saveNotes();
         this.renderNotes();

         if (this.currentNoteId === noteId) {
            this.hideEditor();
            this.resetState();
         }
      }
   }

   cancelEdit() {
      this.hideEditor();
      this.resetState();
   }

   resetState() {
      this.currentNoteId = null;
      this.isEditing = false;
   }

   showEditor() {
      this.noteEditor.style.display = "block";
      this.notesContainer.style.display = "none";
   }

   hideEditor() {
      this.noteEditor.style.display = "none";
      this.notesContainer.style.display = "block";
   }

   searchNotes(query) {
      const noteItems = this.notesContainer.querySelectorAll(".note-item");
      const searchTerm = query.toLowerCase();

      noteItems.forEach((item) => {
         const title = item
            .querySelector(".note-title")
            .textContent.toLowerCase();
         const preview = item
            .querySelector(".note-preview")
            .textContent.toLowerCase();

         if (title.includes(searchTerm) || preview.includes(searchTerm)) {
            item.style.display = "block";
         } else {
            item.style.display = "none";
         }
      });
   }

   renderNotes() {
      if (this.notes.length === 0) {
         this.notesContainer.innerHTML = `
                <div class="empty-state">
                    <h3>📝 첫 번째 메모를 작성해보세요!</h3>
                    <p>새 메모 버튼을 클릭하여 메모를 시작하세요.</p>
                </div>
            `;
         return;
      }

      const notesHTML = this.notes
         .map((note) => {
            const preview =
               note.content.length > 100
                  ? note.content.substring(0, 100) + "..."
                  : note.content;

            const date = new Date(note.updatedAt).toLocaleDateString("ko-KR", {
               year: "numeric",
               month: "short",
               day: "numeric",
               hour: "2-digit",
               minute: "2-digit",
            });

            return `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-preview">${this.escapeHtml(preview)}</div>
                    <div class="note-date">${date}</div>
                    <div class="note-actions">
                        <button class="btn btn-danger" onclick="notepad.deleteNote('${
                           note.id
                        }', event)">삭제</button>
                    </div>
                </div>
            `;
         })
         .join("");

      this.notesContainer.innerHTML = notesHTML;

      // 메모 클릭 이벤트 추가
      this.notesContainer.querySelectorAll(".note-item").forEach((item) => {
         item.addEventListener("click", () => {
            const noteId = item.dataset.noteId;
            this.editNote(noteId);
         });
      });
   }

   escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
   }

   autoSave() {
      // 자동 저장 기능 (디바운싱 적용)
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
         if (
            this.isEditing &&
            (this.noteTitle.value.trim() || this.noteContent.value.trim())
         ) {
            this.saveNote();
         }
      }, 2000); // 2초 후 자동 저장
   }
}

// 확장 프로그램 초기화
let notepad;
document.addEventListener("DOMContentLoaded", () => {
   notepad = new SimpleNotepad();
});
