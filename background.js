// 백그라운드 서비스 워커
chrome.runtime.onInstalled.addListener(() => {
   console.log("간단 메모장 확장 프로그램이 설치되었습니다.");

   // 초기 데이터 설정 (선택사항)
   chrome.storage.local.get(["notes"], (result) => {
      if (!result.notes) {
         const initialNotes = [
            {
               id: "welcome",
               title: "환영합니다! 👋",
               content:
                  "간단 메모장에 오신 것을 환영합니다!\n\n이 확장 프로그램으로 빠르고 간편하게 메모를 작성하고 관리할 수 있습니다.\n\n주요 기능:\n• 새 메모 작성\n• 메모 수정 및 삭제\n• 메모 검색\n• 자동 저장\n\n이 메모는 언제든지 삭제하실 수 있습니다.",
               createdAt: Date.now(),
               updatedAt: Date.now(),
            },
         ];

         chrome.storage.local.set({ notes: initialNotes }, () => {
            console.log("초기 메모가 생성되었습니다.");
         });
      }
   });
});

// 확장 프로그램 아이콘 클릭 시 팝업 열기
chrome.action.onClicked.addListener((tab) => {
   // 팝업이 이미 열려있으면 아무것도 하지 않음
   // 팝업은 manifest.json의 action.default_popup으로 자동 처리됨
});

// 컨텍스트 메뉴 추가 (선택사항)
chrome.runtime.onInstalled.addListener(() => {
   chrome.contextMenus.create({
      id: "addToNotes",
      title: "메모장에 추가",
      contexts: ["selection"],
   });
});

// 컨텍스트 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
   if (info.menuItemId === "addToNotes") {
      const selectedText = info.selectionText;

      // 새 메모 생성
      const newNote = {
         id: Date.now().toString(),
         title:
            selectedText.length > 50
               ? selectedText.substring(0, 50) + "..."
               : selectedText,
         content: selectedText,
         createdAt: Date.now(),
         updatedAt: Date.now(),
      };

      // 기존 메모에 추가
      chrome.storage.local.get(["notes"], (result) => {
         const notes = result.notes || [];
         notes.unshift(newNote);

         chrome.storage.local.set({ notes: notes }, () => {
            console.log("선택된 텍스트가 메모에 추가되었습니다.");

            // 사용자에게 알림
            chrome.notifications.create({
               type: "basic",
               iconUrl: "icons/icon48.png",
               title: "메모장",
               message: "선택한 텍스트가 메모에 추가되었습니다.",
            });
         });
      });
   }
});

// 알림 권한 요청 (선택사항)
chrome.runtime.onInstalled.addListener(() => {
   if (chrome.notifications) {
      chrome.notifications.getPermissionLevel((permission) => {
         if (permission === "default") {
            console.log("알림 권한이 필요할 수 있습니다.");
         }
      });
   }
});
