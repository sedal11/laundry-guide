/**
 * app.js - 메인 애플리케이션 로직
 *
 * 역할: UI(index.html)와 API 모듈(gemini-api.js)을 연결합니다.
 * 의존성: gemini-api.js가 먼저 로드되어 window.GeminiAPI 클래스를 사용할 수 있어야 합니다.
 *
 * 주요 기능:
 *  - API 키 저장 및 유효성 검증
 *  - 채팅 메시지 전송 및 표시
 *  - 빠른 질문 버튼 처리
 *  - UI 상태 관리 (로딩, 입력 비활성화 등)
 */

// 즉시실행함수(IIFE)로 감싸서 전역 스코프 오염 방지
// 안쪽에서 선언한 변수나 함수가 다른 파일의 변수와 충돌하지 않습니다.
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1. DOM 요소 참조
  // ─────────────────────────────────────────────

  // API 키 관련 요소
  const apiKeyInput    = document.querySelector('#api-key-input');    // API 키 입력 필드
  const saveKeyBtn     = document.querySelector('#save-key-btn');     // API 키 저장 버튼
  const apiKeyStatus   = document.querySelector('#api-key-status');   // API 키 상태 메시지
  const apiKeyToggle   = document.querySelector('#api-key-toggle');   // API 키 아코디언 토글 버튼
  const apiKeyContent  = document.querySelector('#api-key-content');  // API 키 아코디언 콘텐츠

  // 채팅 관련 요소
  const chatContainer     = document.querySelector('#chat-container');     // 채팅 메시지 표시 영역
  const welcomeMessage    = document.querySelector('#welcome-message');    // HTML에 있는 환영 메시지
  const userInput         = document.querySelector('#user-input');         // 사용자 입력 textarea
  const sendBtn           = document.querySelector('#send-btn');           // 전송 버튼
  const loadingIndicator  = document.querySelector('#loading-indicator');  // 로딩 표시
  const quickQuestions    = document.querySelector('#quick-questions');    // 빠른 질문 버튼 영역

  // 글자 수 카운터 관련 요소
  const currentChars = document.querySelector('#current-chars');  // 현재 글자 수 표시

  // ─────────────────────────────────────────────
  // 2. 애플리케이션 상태 변수
  // ─────────────────────────────────────────────

  // GeminiAPI 인스턴스 (초기화 시 생성)
  let geminiAPI = null;

  // 현재 메시지를 전송 중인지 여부 (중복 전송 방지)
  let isSending = false;

  // ─────────────────────────────────────────────
  // 3. 초기화 함수
  // ─────────────────────────────────────────────

  /**
   * 앱 초기화 함수
   * DOMContentLoaded 이벤트에서 호출됩니다.
   */
  function init() {
    // GeminiAPI 인스턴스 생성
    // gemini-api.js에서 window.GeminiAPI 클래스를 제공합니다.
    geminiAPI = new window.GeminiAPI();

    // localStorage에서 이전에 저장한 API 키 불러오기
    const savedApiKey = geminiAPI.loadApiKeyFromStorage();
    if (savedApiKey) {
      // 저장된 키가 있으면 입력란에 표시
      apiKeyInput.value = savedApiKey;
      showApiKeyStatus('저장된 API 키가 로드되었습니다. ✓', 'success');
    }

    // 이벤트 리스너 등록
    registerEventListeners();
  }

  // ─────────────────────────────────────────────
  // 4. 이벤트 리스너 등록
  // ─────────────────────────────────────────────

  /**
   * 모든 이벤트 리스너를 한곳에서 등록합니다.
   * 코드 가독성과 유지보수를 위해 분리했습니다.
   */
  function registerEventListeners() {
    // API 키 아코디언 토글 버튼 클릭
    if (apiKeyToggle) {
      apiKeyToggle.addEventListener('click', toggleApiKeySection);
    }

    // API 키 저장 버튼 클릭
    saveKeyBtn.addEventListener('click', handleSaveApiKey);

    // API 키 입력 필드에서 Enter 키 입력 시 저장
    apiKeyInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSaveApiKey();
      }
    });

    // 전송 버튼 클릭
    sendBtn.addEventListener('click', handleSendMessage);

    // textarea 입력 시 전송 버튼 활성화/비활성화 및 글자 수 업데이트
    userInput.addEventListener('input', function () {
      const text = userInput.value.trim();
      // 텍스트가 있으면 전송 버튼 활성화, 없으면 비활성화
      sendBtn.disabled = text.length === 0;
      // 글자 수 카운터 업데이트
      updateCharCount();
    });

    // textarea에서 Enter 키 처리
    // Shift+Enter는 줄바꿈, Enter만 누르면 전송
    userInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // 기본 줄바꿈 동작 막기
        handleSendMessage();
      }
    });

    // 빠른 질문 버튼들에 이벤트 위임(event delegation) 적용
    // 버튼이 여러 개여도 부모 요소 하나에만 리스너를 달아 효율적입니다.
    if (quickQuestions) {
      quickQuestions.addEventListener('click', function (event) {
        // 클릭된 요소가 .quick-btn 클래스를 가진 버튼인지 확인
        const btn = event.target.closest('.quick-btn');
        if (btn) {
          // data-question 속성에서 미리 정의된 질문 텍스트를 가져옴
          const questionText = btn.getAttribute('data-question');
          handleQuickQuestion(questionText);
        }
      });
    }
  }

  // ─────────────────────────────────────────────
  // 5. API 키 관리
  // ─────────────────────────────────────────────

  /**
   * API 키 저장 버튼 클릭 핸들러
   * 입력된 키를 검증하고 localStorage에 저장합니다.
   */
  async function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();

    // 키가 비어있으면 오류 메시지 표시
    if (!apiKey) {
      showApiKeyStatus('API 키를 입력해주세요.', 'error');
      return;
    }

    // 저장 버튼 비활성화 (중복 클릭 방지)
    saveKeyBtn.disabled = true;
    showApiKeyStatus('API 키 확인 중...', 'loading');

    try {
      // GeminiAPI 모듈의 유효성 검증 메서드 호출 (파라미터로 키 전달)
      // 반환값: { valid: boolean, message: string } 형태의 객체
      var result = await geminiAPI.validateApiKey(apiKey);

      if (result.valid) {
        // 검증 성공: API 인스턴스에 키 설정 후 localStorage에 저장
        geminiAPI.setApiKey(apiKey);
        geminiAPI.saveApiKeyToStorage();
        showApiKeyStatus('API 키가 저장되었습니다! ✓', 'success');

        // API 키 섹션 자동 접기 (1초 후 접어서 채팅 공간 확보)
        setTimeout(function () {
          collapseApiKeySection();
        }, 1000);
      } else {
        // 검증 실패: 서버에서 받은 상세 오류 메시지를 그대로 표시
        showApiKeyStatus(result.message || '유효하지 않은 API 키입니다.', 'error');
      }
    } catch (error) {
      // 네트워크 오류 등 예외 처리
      showApiKeyStatus('키 확인 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
      // 성공/실패 여부와 상관없이 버튼 다시 활성화
      saveKeyBtn.disabled = false;
    }
  }

  /**
   * API 키 상태 메시지를 표시합니다.
   * @param {string} message - 표시할 메시지 텍스트
   * @param {string} type    - 메시지 유형: 'success' | 'error' | 'loading'
   */
  function showApiKeyStatus(message, type) {
    if (!apiKeyStatus) return;

    apiKeyStatus.textContent = message;

    // 기존 상태 클래스 모두 제거 후 새 클래스 추가
    apiKeyStatus.className = 'api-key-status'; // 기본 클래스 리셋
    if (type === 'success') {
      apiKeyStatus.style.color = '#2e7d32'; // 초록색
    } else if (type === 'error') {
      apiKeyStatus.style.color = '#c62828'; // 빨간색
    } else {
      apiKeyStatus.style.color = '#555';    // 기본 회색 (로딩 중)
    }

    apiKeyStatus.style.display = 'block';
  }

  /**
   * API 키 아코디언 섹션을 접습니다.
   * aria-expanded 속성과 콘텐츠 영역의 표시 상태를 변경합니다.
   */
  function collapseApiKeySection() {
    if (apiKeyToggle && apiKeyContent) {
      apiKeyToggle.setAttribute('aria-expanded', 'false');
      apiKeyContent.classList.remove('is-open');
    }
  }

  /**
   * API 키 아코디언 섹션 접기/펼치기 토글
   * 토글 버튼 클릭 시 호출됩니다.
   */
  function toggleApiKeySection() {
    if (!apiKeyToggle || !apiKeyContent) return;

    // 현재 상태 확인 (aria-expanded 속성 기반)
    const isExpanded = apiKeyToggle.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      // 열려있으면 → 접기
      apiKeyToggle.setAttribute('aria-expanded', 'false');
      apiKeyContent.classList.remove('is-open');
    } else {
      // 접혀있으면 → 펼치기
      apiKeyToggle.setAttribute('aria-expanded', 'true');
      apiKeyContent.classList.add('is-open');
    }
  }

  // ─────────────────────────────────────────────
  // 6. 메시지 전송
  // ─────────────────────────────────────────────

  /**
   * 메시지 전송 핸들러
   * 전송 버튼 클릭 또는 Enter 키 입력 시 호출됩니다.
   */
  async function handleSendMessage() {
    // 이미 전송 중이면 무시 (중복 전송 방지)
    if (isSending) return;

    const message = userInput.value.trim();

    // 빈 메시지 무시
    if (!message) return;

    // API 키가 설정되어 있는지 확인
    if (!geminiAPI.hasApiKey()) {
      addErrorMessage('API 키가 설정되지 않았습니다. 상단의 ⚙️ API 키 설정을 먼저 완료해주세요.');
      return;
    }

    // 첫 메시지 전송 시 HTML 환영 메시지 숨기기
    hideWelcomeMessage();

    // 전송 상태 진입: UI 잠금
    isSending = true;
    setInputDisabled(true);
    showLoading(true);

    // 사용자 메시지를 채팅창에 추가
    addUserMessage(message);

    // 입력란 초기화 및 글자 수 리셋
    userInput.value = '';
    updateCharCount();

    try {
      // GeminiAPI를 통해 AI 응답 요청
      const response = await geminiAPI.sendMessage(message);

      // AI 응답을 채팅창에 추가
      addAIMessage(response);
    } catch (error) {
      // 오류 발생 시 에러 메시지 표시
      addErrorMessage(error.message);
    } finally {
      // 성공/실패 여부와 상관없이 UI 잠금 해제
      isSending = false;
      setInputDisabled(false);
      showLoading(false);
      // 전송 버튼 비활성화 (입력란이 비어있으므로)
      sendBtn.disabled = true;

      // 입력란에 포커스 복귀 (사용자가 바로 다음 질문 입력 가능하도록)
      userInput.focus();
    }
  }

  // ─────────────────────────────────────────────
  // 7. 빠른 질문 버튼
  // ─────────────────────────────────────────────

  /**
   * 빠른 질문 버튼 클릭 핸들러
   * data-question 속성의 질문을 입력란에 넣고 자동으로 전송합니다.
   * @param {string} questionText - 빠른 질문 버튼의 data-question 텍스트
   */
  function handleQuickQuestion(questionText) {
    if (!questionText) return;

    // 입력란에 질문 텍스트 설정
    userInput.value = questionText;

    // 전송 버튼 활성화
    sendBtn.disabled = false;

    // 자동 전송
    handleSendMessage();
  }

  // ─────────────────────────────────────────────
  // 8. 채팅 메시지 표시 함수
  // ─────────────────────────────────────────────

  /**
   * HTML에 미리 작성된 환영 메시지를 숨깁니다.
   * 사용자가 첫 메시지를 보낼 때 호출됩니다.
   */
  function hideWelcomeMessage() {
    if (welcomeMessage) {
      welcomeMessage.style.display = 'none';
    }
  }

  /**
   * 사용자 메시지를 채팅창에 추가합니다.
   * 오른쪽 정렬, .user-message 클래스 적용
   * @param {string} message - 표시할 사용자 메시지 텍스트
   */
  function addUserMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message user-message';

    // XSS 방지: textContent를 사용하여 안전하게 삽입
    messageEl.textContent = message;

    chatContainer.appendChild(messageEl);
    scrollToBottom();
  }

  /**
   * AI 응답 메시지를 채팅창에 추가합니다.
   * 왼쪽 정렬, .ai-message 클래스 적용
   * 줄바꿈(\n)을 <br>로 변환하여 표시합니다.
   * @param {string} message - AI가 반환한 응답 텍스트
   */
  function addAIMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message ai-message';

    // 텍스트의 줄바꿈(\n)을 <br>로 변환해서 표시
    // innerHTML을 쓰기 전에 반드시 이스케이프 처리를 합니다.
    messageEl.innerHTML = formatMessage(message);

    chatContainer.appendChild(messageEl);
    scrollToBottom();
  }

  /**
   * 에러 메시지를 채팅창에 추가합니다.
   * .error-message 클래스 적용
   * @param {string} message - 표시할 에러 메시지 텍스트
   */
  function addErrorMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message error-message';

    // XSS 방지: textContent를 사용하여 안전하게 삽입
    messageEl.textContent = message;

    chatContainer.appendChild(messageEl);
    scrollToBottom();
  }

  // ─────────────────────────────────────────────
  // 9. 메시지 포맷팅
  // ─────────────────────────────────────────────

  /**
   * AI 응답 텍스트를 HTML로 변환합니다.
   * 1) 특수문자를 HTML 이스케이프 처리 (XSS 방지)
   * 2) 줄바꿈(\n)을 <br>로 변환
   *
   * @param {string} text - 변환할 텍스트
   * @returns {string}    - HTML 문자열
   */
  function formatMessage(text) {
    // 1단계: HTML 특수문자 이스케이프 (XSS 방지)
    const escaped = escapeHtml(text);

    // 2단계: 줄바꿈 문자(\n)를 HTML <br> 태그로 변환
    return escaped.replace(/\n/g, '<br>');
  }

  /**
   * 문자열에서 HTML 특수문자를 이스케이프합니다.
   * XSS(Cross-Site Scripting) 공격을 막기 위한 필수 처리입니다.
   *
   * @param {string} text - 이스케이프할 원본 텍스트
   * @returns {string}    - 이스케이프된 텍스트
   */
  function escapeHtml(text) {
    // 이스케이프 대상 문자와 대체 문자열 매핑
    var escapeMap = {
      '&':  '&amp;',
      '<':  '&lt;',
      '>':  '&gt;',
      '"':  '&quot;',
      "'":  '&#x27;',
    };

    // 각 특수문자를 대응하는 HTML 엔티티로 교체
    return String(text).replace(/[&<>"']/g, function (char) {
      return escapeMap[char];
    });
  }

  // ─────────────────────────────────────────────
  // 10. UI 유틸리티 함수
  // ─────────────────────────────────────────────

  /**
   * 로딩 인디케이터를 표시하거나 숨깁니다.
   * HTML에서 hidden 클래스로 기본 숨김 처리되어 있습니다.
   * @param {boolean} show - true면 표시, false면 숨김
   */
  function showLoading(show) {
    if (!loadingIndicator) return;

    if (show) {
      loadingIndicator.classList.remove('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * 사용자 입력 요소들을 비활성화하거나 활성화합니다.
   * 메시지 전송 중에 중복 입력을 막기 위해 사용합니다.
   * @param {boolean} disabled - true면 비활성화, false면 활성화
   */
  function setInputDisabled(disabled) {
    // 전송 버튼 비활성화/활성화
    if (sendBtn) {
      sendBtn.disabled = disabled;
    }

    // 텍스트 입력란 비활성화/활성화
    if (userInput) {
      userInput.disabled = disabled;
    }
  }

  /**
   * 채팅창을 맨 아래로 자동 스크롤합니다.
   * 새 메시지가 추가될 때마다 호출하여 최신 메시지가 보이도록 합니다.
   */
  function scrollToBottom() {
    if (!chatContainer) return;

    // scrollTop을 scrollHeight로 설정하면 맨 아래로 이동합니다.
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /**
   * 입력란의 글자 수 카운터를 업데이트합니다.
   */
  function updateCharCount() {
    if (currentChars) {
      currentChars.textContent = userInput.value.length;
    }
  }

  // ─────────────────────────────────────────────
  // 11. 앱 시작
  // ─────────────────────────────────────────────

  // DOM이 모두 준비된 후 초기화 함수 실행
  // HTML 파일에서 이 스크립트를 <body> 끝에 배치하면
  // DOMContentLoaded 없이도 동작하지만, 안전을 위해 이벤트를 사용합니다.
  document.addEventListener('DOMContentLoaded', init);

})(); // IIFE 종료
