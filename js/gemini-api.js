/**
 * gemini-api.js
 * Gemini AI API와 통신하는 모듈
 * 브라우저에서 직접 실행되는 클라이언트 사이드 JavaScript
 */

/**
 * GeminiAPI 클래스
 * Gemini AI API와의 모든 통신을 담당합니다.
 * API 키 관리, 메시지 전송, 에러 처리 기능을 포함합니다.
 */
class GeminiAPI {

    /**
     * 생성자 - GeminiAPI 객체를 만들 때 실행됩니다.
     * @param {string} apiKey - Gemini API 키 (선택 사항, 나중에 setApiKey로도 설정 가능)
     */
    constructor(apiKey = null) {
        // API 키를 저장하는 변수 (없으면 null)
        this.apiKey = apiKey;

        // Gemini API 엔드포인트 주소 (고정값)
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

        // localStorage에 API 키를 저장할 때 사용할 키 이름
        this.storageKey = 'gemini_api_key';

        // 세탁 전문가 역할을 부여하는 시스템 프롬프트
        // AI에게 어떤 역할을 해야 하는지 알려주는 지시문입니다.
        this.systemPrompt = '당신은 세탁 전문가입니다. 다양한 옷감과 소재에 대한 세탁 방법, 얼룩 제거법, 세탁 기호 해석, 건조 방법, 다림질 팁 등을 친절하고 상세하게 한국어로 설명해주세요. 답변은 구조적으로 정리하여 읽기 쉽게 작성해주세요. 마크다운 형식을 사용하지 말고 일반 텍스트로 답변해주세요.';
    }

    /**
     * API 키를 설정하거나 변경합니다.
     * @param {string} apiKey - 새로운 Gemini API 키
     */
    setApiKey(apiKey) {
        // 전달받은 API 키를 저장합니다.
        this.apiKey = apiKey;
    }

    /**
     * API 키가 설정되어 있는지 확인합니다.
     * @returns {boolean} API 키가 있으면 true, 없으면 false
     */
    hasApiKey() {
        // API 키가 빈 문자열이 아니고, null/undefined가 아닌지 확인
        return !!this.apiKey;
    }

    /**
     * API 키의 유효성을 확인합니다.
     * 간단한 테스트 요청을 보내서 API 키가 올바른지 검증합니다.
     * @returns {Promise<boolean>} API 키가 유효하면 true, 아니면 false
     */
    async validateApiKey(apiKey) {
        // 파라미터로 API 키가 전달되면 해당 키를 사용, 없으면 내부 키 사용
        const keyToValidate = apiKey || this.apiKey;

        // 검증할 API 키가 없으면 에러 메시지와 함께 반환
        if (!keyToValidate) {
            return { valid: false, message: 'API 키를 입력해주세요.' };
        }

        try {
            // 짧은 테스트 메시지로 API 요청을 보냅니다.
            // maxOutputTokens를 1로 설정해서 응답을 최소화합니다.
            const response = await fetch(`${this.apiEndpoint}?key=${keyToValidate}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: '안녕' }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1
                    }
                })
            });

            // HTTP 상태 코드가 200번대이면 유효한 API 키입니다.
            if (response.ok) {
                return { valid: true, message: '' };
            }

            // 실패 시 API 응답에서 실제 에러 메시지를 가져옵니다.
            const errorData = await response.json().catch(() => ({}));
            const serverMessage = errorData?.error?.message || '';

            // 상태 코드별로 사용자에게 알기 쉬운 메시지를 반환합니다.
            if (response.status === 400) {
                return { valid: false, message: 'API 키 형식이 올바르지 않습니다. ' + serverMessage };
            } else if (response.status === 403) {
                return { valid: false, message: 'API 키 권한이 없습니다. Gemini API가 활성화되어 있는지 확인해주세요.' };
            } else if (response.status === 404) {
                return { valid: false, message: '모델을 찾을 수 없습니다. ' + serverMessage };
            } else if (response.status === 429) {
                return { valid: false, message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
            } else {
                return { valid: false, message: '서버 오류 (' + response.status + '): ' + serverMessage };
            }

        } catch (error) {
            // 네트워크 오류 (인터넷 연결 없음, CORS 등)
            console.error('API 키 검증 중 오류 발생:', error);
            return { valid: false, message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.' };
        }
    }

    /**
     * 사용자의 세탁 관련 질문을 Gemini AI에 전송하고 응답을 받습니다.
     * 시스템 프롬프트를 포함하여 AI가 세탁 전문가 역할을 하도록 합니다.
     * @param {string} userMessage - 사용자가 입력한 질문 내용
     * @returns {Promise<string>} AI의 답변 텍스트
     */
    async sendMessage(userMessage) {
        // API 키가 설정되어 있지 않으면 에러 메시지 반환
        if (!this.apiKey) {
            throw new Error('API 키를 먼저 입력해주세요.');
        }

        try {
            // Gemini API에 보낼 요청 데이터를 구성합니다.
            // 시스템 프롬프트와 사용자 질문을 함께 포함합니다.
            const requestBody = {
                contents: [
                    {
                        role: 'user',
                        // 시스템 프롬프트와 사용자 질문을 하나의 텍스트로 합칩니다.
                        parts: [{ text: this.systemPrompt + '\n\n사용자 질문: ' + userMessage }]
                    }
                ],
                // AI 응답의 품질과 길이를 조절하는 설정값들
                generationConfig: {
                    temperature: 0.7,       // 창의성 수준 (0~1, 높을수록 창의적)
                    topK: 40,               // 상위 K개의 단어 후보 중에서 선택
                    topP: 0.95,             // 확률 합산 임계값 (다양성 조절)
                    maxOutputTokens: 2048   // 최대 응답 길이 (토큰 단위)
                }
            };

            // fetch를 사용해서 Gemini API에 POST 요청을 보냅니다.
            // API 키는 URL 파라미터로 전달합니다.
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            // HTTP 응답이 실패(200번대가 아님)인 경우 에러 처리
            if (!response.ok) {
                // 상태 코드에 따라 적절한 에러 메시지를 던집니다.
                if (response.status === 401) {
                    throw new Error('API 키가 올바르지 않습니다.');
                } else if (response.status === 429) {
                    throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    // 기타 HTTP 오류는 상세 내용을 파싱해서 전달합니다.
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData?.error?.message || `HTTP 오류 ${response.status}`;
                    throw new Error('오류가 발생했습니다: ' + errorMessage);
                }
            }

            // 성공 응답을 JSON으로 파싱합니다.
            const data = await response.json();

            // Gemini API 응답에서 실제 텍스트 내용을 꺼냅니다.
            // 응답 구조: data.candidates[0].content.parts[0].text
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            // 텍스트 내용이 없으면 에러를 던집니다.
            if (!aiText) {
                throw new Error('오류가 발생했습니다: AI 응답에서 텍스트를 찾을 수 없습니다.');
            }

            // AI의 답변 텍스트를 반환합니다.
            return aiText;

        } catch (error) {
            // 이미 우리가 만든 에러 메시지면 그대로 다시 던집니다.
            if (error.message.startsWith('API 키를') ||
                error.message.startsWith('API 키가') ||
                error.message.startsWith('요청이 너무') ||
                error.message.startsWith('오류가 발생했습니다')) {
                throw error;
            }

            // fetch 자체가 실패한 경우 (인터넷 연결 없음 등) 네트워크 에러로 처리합니다.
            if (error instanceof TypeError) {
                throw new Error('네트워크 연결을 확인해주세요.');
            }

            // 그 외 예상치 못한 에러는 일반 에러 메시지로 포장합니다.
            throw new Error('오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * 현재 API 키를 브라우저의 localStorage에 저장합니다.
     * 페이지를 새로고침해도 API 키가 유지됩니다.
     * @returns {boolean} 저장 성공 여부
     */
    saveApiKeyToStorage() {
        // API 키가 없으면 저장하지 않고 false 반환
        if (!this.apiKey) {
            console.warn('저장할 API 키가 없습니다.');
            return false;
        }

        try {
            // localStorage에 API 키를 저장합니다.
            localStorage.setItem(this.storageKey, this.apiKey);
            return true;
        } catch (error) {
            // localStorage 사용이 불가능한 환경(예: 시크릿 모드 일부 브라우저)에서 발생
            console.error('API 키를 저장하는 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 브라우저의 localStorage에서 API 키를 불러옵니다.
     * 이전에 저장한 API 키를 복원할 때 사용합니다.
     * @returns {string|null} 저장된 API 키, 없으면 null
     */
    loadApiKeyFromStorage() {
        try {
            // localStorage에서 API 키를 읽어옵니다.
            const savedApiKey = localStorage.getItem(this.storageKey);

            // 불러온 API 키가 있으면 인스턴스에도 저장합니다.
            if (savedApiKey) {
                this.apiKey = savedApiKey;
            }

            return savedApiKey;
        } catch (error) {
            // localStorage 접근 오류 시 null 반환
            console.error('API 키를 불러오는 중 오류 발생:', error);
            return null;
        }
    }
}

// 브라우저 전역 객체(window)에 GeminiAPI 클래스를 등록합니다.
// 다른 JavaScript 파일에서 window.GeminiAPI 또는 GeminiAPI로 사용할 수 있습니다.
window.GeminiAPI = GeminiAPI;
