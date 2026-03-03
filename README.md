# 🧺 세탁 방법을 알려줘

> Gemini AI를 활용한 24시간 세탁 방법 안내 웹페이지

---

## 스크린샷

<!-- 스크린샷 이미지를 여기에 추가하세요 -->
<!-- 예시: ![메인 화면](screenshots/main.png) -->

```
스크린샷 준비 중...
```

---

## 주요 기능

- **AI 기반 세탁 방법 상담** — Gemini AI가 옷감 종류와 오염 상태에 맞는 세탁법을 안내
- **다양한 소재별 세탁법 안내** — 면, 울, 실크, 폴리에스터 등 소재별 맞춤 가이드
- **얼룩 제거 방법 안내** — 음식, 기름, 잉크 등 얼룩 종류별 제거법 제공
- **세탁 기호 해석** — 의류 태그의 세탁 기호를 알기 쉽게 설명
- **빠른 질문 버튼** — 자주 묻는 질문을 버튼 하나로 빠르게 조회

---

## 사용 기술

| 기술 | 설명 |
|------|------|
| HTML | 웹페이지 구조 |
| CSS | 스타일 및 반응형 레이아웃 |
| JavaScript | 클라이언트 사이드 로직 |
| [Gemini API](https://ai.google.dev/) | AI 기반 세탁 방법 응답 생성 |

---

## 프로젝트 구조

```
laundry-guide/
├── index.html          # 메인 HTML 파일
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── gemini-api.js   # Gemini API 통신 모듈
│   └── app.js          # 메인 애플리케이션 로직
└── README.md           # 프로젝트 설명서
```

---

## 시작하기

### 사전 준비

- 최신 웹 브라우저 (Chrome, Edge, Firefox 권장)
- Google AI Studio API 키

### 설치 및 실행

**1단계 — Google AI Studio에서 API 키 발급**

[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) 에 접속하여 API 키를 발급받으세요.

**2단계 — 프로젝트 다운로드**

```bash
git clone https://github.com/sedal11/laundry-guide.git
cd laundry-guide
```

또는 ZIP 파일로 다운로드 후 압축 해제

**3단계 — 브라우저에서 열기**

- **방법 A (직접 열기):** `index.html` 파일을 브라우저로 드래그 앤 드롭
- **방법 B (로컬 서버):** 아래 로컬 서버 실행 방법 참고

**4단계 — API 키 입력 후 사용**

웹페이지 상단의 API 키 입력란에 발급받은 키를 입력하고 세탁 방법을 질문하세요.

### 로컬 서버 실행 (선택 사항)

CORS 문제가 발생하는 경우 로컬 서버를 사용하세요.

**Windows:**
```bat
serve.bat
```

**Mac / Linux:**
```bash
chmod +x serve.sh
./serve.sh
```

서버 실행 후 브라우저에서 [http://localhost:8080](http://localhost:8080) 접속

---

## 사용된 API

| 항목 | 내용 |
|------|------|
| API | Gemini 2.0 Flash |
| 제공사 | Google AI (Google DeepMind) |
| 문서 | [https://ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs) |

---

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.