# Loop Engineering 실습 프롬프트 v4

> 역할: **Codex는 코드 수정**, **Claude Code CLI Sonnet은 테스트·Verifier**를 담당합니다. Claude를 사용할 수 없을 때만 Codex가 수정과 테스트를 모두 수행합니다.

## Step 1

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 1 - 개발 업무 분석]

위 저장소로 반응형 개인 프로페셔널 웹사이트를 만들고, 상단 Games 메뉴와 키보드·모바일 터치로 조작하는 지렁이 게임을 추가하려고 해. 정적 HTML, CSS, JavaScript만 사용해.

업무를 작은 개발 루프로 나누고 다음 표로 정리해:
루프 | 입력 | Act | Observe | 통과 기준 | 위험도 | HITL | 첫 루프 적합성

가장 안전한 첫 루프를 하나 추천해. 프로필 자료와 게임 추가 기능도 반영하되, 확인되지 않은 내용은 [사람 확인 필요]로 표시해.

코드 수정, 테스트, push, 배포는 하지 마.
결과를 STEP1_ANALYSIS.md에 저장하고 핵심만 보고해.

보안:
- 인증이 필요할 때만 토큰 파일 사용
- 토큰을 출력·로그·코드·문서·Git에 남기지 않기
```

## Step 2

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 2 - AORR 상태 머신 설계]

STEP1_ANALYSIS.md와 저장소 구조를 읽고 실행 가능한 AORR 상태 머신을 설계해.

역할:
- Codex: 코드 분석과 최소 수정
- Claude Code CLI Sonnet: 테스트 실행과 Verifier
- Claude 사용 불가 시에만 Codex가 수정과 테스트를 모두 수행

최종 목표:
- 정적 프로페셔널 웹사이트
- 데스크톱·태블릿·모바일 반응형 지원
- Games 메뉴
- 키보드·터치 지렁이 게임
- GitHub Pages 배포

AORR.md에 다음만 작성해:
1. Target과 완료 기준
2. Act: Codex가 수행할 최소 수정
3. Observe: Claude가 실행할 테스트와 수집할 결과
4. Reason: 실패 원인 분류
5. Repeat: Codex 최소 수정 → Claude 동일 테스트 재실행
6. Stop과 HITL 조건
7. 개발 루프 표:
   루프 | 입력 | Codex Act | Claude Verify | 통과 기준 | 다음 상태

상태:
READY, ACTING, VERIFYING, RETRYING, PASSED,
DEPLOY_APPROVAL_REQUIRED, DEPLOYED, BLOCKED, HITL_REQUIRED

실패 분류:
HTML, CSS, JAVASCRIPT, GAME, CONTENT, TEST,
ENVIRONMENT, GITHUB, DEPLOYMENT, UNKNOWN

규칙:
- 한 Retry에서는 원인 하나와 관련 파일만 수정
- Claude의 전체 검증이 통과해야 PASSED
- Claude CLI 사용 불가 시 CODEX_FALLBACK으로 기록
- 불명확한 내용은 [사람 확인 필요]

아직 코드 수정, 테스트, push, 배포는 하지 마.
```

## Step 3

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 3 - Self-Correcting TDD 설계]

AORR.md와 저장소 구조를 읽고 Verifier 중심 Self-Correcting TDD 루프를 설계해.

기본 모드:
- Codex = Worker: 코드 분석과 최소 수정
- Claude Code CLI Sonnet = Verifier: 변경 전·후 테스트 실행
- Codex는 Claude가 실행한 테스트를 중복 실행하지 않음

먼저 확인할 것:
1. `claude` 명령 사용 가능 여부
2. 로그인 및 실행 가능 여부
3. 사용 가능한 Sonnet 모델
4. Sonnet 5가 실제 사용 가능하면 사용
5. 불가능하면 사용 가능한 최신 Sonnet 모델 사용
6. 실제 모델명을 AORR.md와 MEMORY.md에 기록
7. Claude 사용 불가 시 CODEX_FALLBACK 모드 사용

AORR.md에 `Self-Correcting TDD Loop`를 추가해.

실행 순서:
1. Claude가 변경 전 테스트 실행
2. Claude가 실패 항목, 핵심 오류, 관련 파일, fingerprint 보고
3. Codex가 원인 하나에 필요한 최소 코드만 수정
4. Claude가 동일 테스트 재실행
5. 실패 시 Claude가 새 결과와 fingerprint 보고
6. Codex가 최소 수정 후 Claude에 재검증 요청
7. Claude의 전체 테스트가 통과해야 PASSED

검증 범위:
- 파일 존재와 상대 경로
- HTML 구조와 내부 링크
- CSS 반응형
- JavaScript 오류
- 지렁이 게임 기능과 입력
- 로컬 HTTP 응답
- 375px, 768px, 1440px
- GitHub Pages 호환성

실패 기록:
- 실행 주체와 모델
- 명령
- exit code
- 핵심 오류
- 관련 파일·라인
- fingerprint
- 최종 상태

Retry:
- 오류당 최대 3회
- 동일 fingerprint 2회면 중지
- 한 Retry에서는 원인 하나와 최소 파일만 수정
- 테스트 삭제·완화 금지

Fallback:
- Claude CLI를 사용할 수 없을 때만 Codex가 수정과 테스트를 모두 수행
- Fallback 이유와 사용 여부를 기록

이 단계에서는 코드 수정, 테스트 실행, push, 배포를 하지 마.
```

## Step 4

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 4 - 간결한 MEMORY.md 작성]

AORR.md를 읽고 프로젝트 복구용 MEMORY.md를 작성해.

MEMORY.md 구성:
- Goal: 한 줄
- Scope / Out of Scope
- Execution:
  - Mode: CODEX_WORKER + CLAUDE_VERIFIER 또는 CODEX_FALLBACK
  - Claude model
  - Last test: PASS/FAIL
- Current State:
  - 상태
  - 완료 루프
  - 다음 루프
  - Retry
  - fingerprint
  - blocker
  - 마지막 정상 commit·URL
- Acceptance
- Guardrails
- Retry / HITL
- Recent Loops: 최근 3개만 유지

Recent Loops 표:
Loop | 상태 | 실행 모드·모델 | 변경 파일 | 테스트 결과 | Retry | 다음 작업

길이 규칙:
- 최대 60줄 또는 약 4KB
- 항목당 한 줄
- 원시 로그, 전체 명령 출력, diff, 코드 블록 저장 금지
- 같은 섹션을 반복 추가하지 말고 현재 상태를 갱신
- 상세 실행 기록은 AORR_LOG.md에 저장

Guardrails:
- 확인되지 않은 개인 정보 생성 금지
- 기존 콘텐츠 임의 삭제 금지
- 테스트 삭제·완화 금지
- 대규모 재작성 금지
- 백엔드·외부 서비스·프레임워크 임의 추가 금지
- 토큰 출력·로그·코드·문서·Git 저장 금지

아직 웹사이트 코드 수정, 테스트, push, 배포는 하지 마.
```

## Step 5

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 5 - 첫 개발 루프 정확히 1회 실행]

STEP1_ANALYSIS.md, AORR.md, MEMORY.md와 기존 파일을 읽고 가장 안전한 첫 개발 루프를 정확히 1회 실행해.

역할:
- Claude Code CLI Sonnet: 변경 전·후 테스트
- Codex: 테스트 결과에 따른 최소 코드 수정
- Claude 사용 불가 시에만 Codex가 수정과 테스트를 모두 수행

실행 순서:
1. MEMORY.md와 Git 상태 확인
2. Claude CLI와 사용 가능한 Sonnet 모델 확인
3. Claude가 변경 전 Verifier 실행
4. 이번 루프의 최소 완료 기준 하나 확정
5. Codex가 필요한 최소 파일만 생성 또는 수정
6. Claude가 동일 Verifier 재실행
7. 결과를 MEMORY.md와 AORR_LOG.md에 기록
8. 정확히 한 번의 Act 후 중지

기본 후보:
- 기존 콘텐츠를 보존
- index.html, styles.css, script.js 연결
- meta viewport
- 기본 반응형 내비게이션
- Games 영역 준비
- 전체 게임은 아직 구현하지 않음

제한:
- Claude 검증 실패 후 두 번째 Codex 수정은 하지 마
- 실패 시 RETRY_NEEDED 또는 HITL_REQUIRED로 기록
- push와 배포 금지
- MEMORY.md에는 한 줄 요약만 기록
- 상세 내용은 AORR_LOG.md에 기록

최종 보고:
- 실행 모드와 Claude 모델
- 선택한 루프
- 변경 파일
- Claude 변경 전·후 테스트 결과
- 현재 상태
- 다음 작업
```

## Step 6

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 6 - 자동화 준비도와 현업 적용 계획]

STEP1_ANALYSIS.md, AORR.md, MEMORY.md와 Step 5 결과를 읽고 자동화 준비도를 평가해.

AUTOMATION_READINESS.md에 다음 표를 작성해:
루프 | 자동화 수준 | Codex 역할 | Claude Verifier | 위험도 | 권한 | Rollback | 준비 상태 | 보완점

자동화 수준:
- AUTO
- HITL
- MANUAL

추가로 핵심만 작성해:
- 지금 자동화하기 가장 좋은 루프 1개
- 사람이 반드시 승인해야 하는 지점
- Claude Verifier가 확인해야 할 항목
- Claude 사용 불가 시 Fallback 방식
- 운영 전 필요한 테스트·권한·모니터링
- 현업 적용 다음 액션 3개

코드 수정, 테스트, push, 배포는 하지 마.
문서는 2페이지 이내로 작성해.
```

## Step 7

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 7 - 전체 구현과 최초 배포]

STEP1_ANALYSIS.md, AORR.md, MEMORY.md와 기존 코드를 읽고 작은 AORR·TDD 루프를 순서대로 실행해 전체 사이트를 완성해.

역할:
- Codex: 코드 분석과 최소 수정
- Claude Code CLI Sonnet: 각 루프의 변경 전·후 테스트와 최종 검증
- Codex는 Claude가 실행한 테스트를 중복 실행하지 않음
- Claude 사용 불가 시에만 Codex가 수정과 테스트를 모두 수행

먼저:
1. Claude CLI 실행 가능 여부 확인
2. Sonnet 5 사용 가능 여부 확인
3. 불가능하면 사용 가능한 최신 Sonnet 사용
4. 실제 모델명과 실행 모드를 MEMORY.md에 기록

필수 범위:
- 정적 HTML, CSS, JavaScript
- Home, About, Contact
- Projects·Experience·Research 중 확인 가능한 영역
- 반응형 내비게이션과 Games 메뉴
- 지렁이 게임:
  시작, 이동, 음식, 성장, 점수, 충돌,
  게임 오버, 일시정지, 재시작, 최고 점수
- 방향키, WASD, 모바일 버튼
- 반대 방향 방지
- 중복 타이머 방지
- 교육생 설정의 게임 추가 기능
- 375px, 768px, 1440px 검증
- 로컬 HTTP, 콘솔, 내부 링크, 상대 경로 검증

각 루프:
1. Claude가 변경 전 테스트
2. Codex가 원인 하나를 최소 수정
3. Claude가 동일 테스트 재실행
4. 실패 시 Claude가 오류와 fingerprint 보고
5. Codex가 최소 Retry
6. Claude가 다시 검증
7. Claude 전체 검증 통과 시 다음 루프로 이동

Retry:
- 오류당 최대 3회
- 동일 fingerprint 2회면 중지
- 한 Retry에서는 원인 하나와 최소 파일만 수정
- 테스트 삭제·완화 금지

기타 규칙:
- 기존 콘텐츠 보존
- 확인되지 않은 정보는 [사람 확인 필요]
- MEMORY.md는 60줄 이내
- 상세 로그는 AORR_LOG.md
- 미완성 기능이 있으면 PASSED 처리 금지

모든 로컬 검증이 통과하면:
- 상태를 DEPLOY_APPROVAL_REQUIRED로 설정
- 저장소, 변경 내용, 예상 URL을 보여주고 중지
- 사용자 승인 전에는 commit, push, 배포 금지

사용자 승인 후:
1. 토큰·비밀정보 추적 여부 확인
2. commit과 push
3. GitHub Pages 배포
4. HTTP 200 확인
5. Claude가 배포본 회귀 테스트
6. 통과 시 DEPLOYED
```

## Step 8

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 8 - 사용자 수정 요청 분석]

[사용자 수정 요청]
[배포된 사이트에서 바꾸고 싶은 내용을 입력]

[추가 자료]
[기기, 브라우저, 재현 방법, 참고 디자인, CV/PDF/이미지 등을 입력]

배포된 사이트, 현재 코드, Git 상태, AORR.md, MEMORY.md,
마지막 정상 배포 commit·URL과 참고 자료를 확인해.

이번 단계에서는 구현하거나 테스트하지 마.

요청 원문을 보존하고 원자적인 Change Item으로 나눠
CHANGE_REQUEST.md에 저장해.

표:
ID | 원문 | 분류 | 현재/기대 동작 | 대상 파일 | 의존성 |
완료 기준 | Claude 검증 | 회귀 테스트 | 위험도 | HITL

분류:
BUG, UI_UX, RESPONSIVE, PERFORMANCE, CONTENT,
STRUCTURE, NAVIGATION, GAME, ACCESSIBILITY,
DEPLOYMENT, SECURITY, UNKNOWN

규칙:
- 중복·충돌·모호성 표시
- 의존성 순서 결정
- 문서 기반 요청은 파일에서 확인된 사실만 사용
- 개인정보 공개 여부와 불확실한 내용은 [사람 확인 필요]
- Claude가 실행할 변경 전·후 테스트를 Change Item마다 정의
- AORR.md에는 실행 순서만 간단히 추가

코드 수정, 테스트, commit, push, 배포는 금지해.
```

## Step 9

```text
[교육생 설정]
- GitHub Pages 주소: https://[username].github.io
- GitHub 저장소: https://github.com/[username]/[username].github.io.git
- GitHub 토큰 파일: github_token.txt
- 프로필 참고 자료: [CV.pdf 또는 없음]
- 게임 추가 기능: [없음 또는 원하는 기능]

[Step 9 - 변경 요청 재루프]

CHANGE_REQUEST.md, AORR.md, MEMORY.md, 현재 코드와
마지막 정상 배포 상태를 읽고 Change Item을 의존성 순서대로 구현해.

역할:
- Codex: Change Item 코드 수정
- Claude Code CLI Sonnet: 변경 전·후 테스트와 회귀 검증
- Codex는 Claude 테스트를 중복 실행하지 않음
- Claude 사용 불가 시에만 Codex가 수정과 테스트를 모두 수행

시작 전에 MEMORY.md에 기록:
- 실행 모드와 Claude 모델
- 현재 commit
- 마지막 정상 commit·URL
- Git 상태
- Rollback 기준

각 Change Item:
1. Claude가 변경 전 문제 재현 및 테스트
2. Claude가 오류, 관련 파일, fingerprint 보고
3. Codex가 승인 범위 안에서 최소 수정
4. Claude가 동일 테스트와 관련 회귀 테스트 실행
5. 실패 시 Codex가 원인 하나만 최소 Retry
6. Claude가 재검증
7. Claude 전체 검증 통과 시 PASSED

규칙:
- 문서에 없는 사실 생성 금지
- 승인 범위 밖 파일 수정 금지
- 오류당 최대 3회
- 동일 fingerprint 2회면 BLOCKED 또는 HITL_REQUIRED
- 테스트·완료 기준 완화 금지
- 기능 제거로 우회 금지
- force push, hard reset, 기록 재작성 금지
- MEMORY.md에는 최근 3개 루프만 유지
- 상세 로그는 AORR_LOG.md에 기록

모든 Change Item과 전체 회귀 테스트 통과 후:
- DEPLOY_APPROVAL_REQUIRED로 설정
- 변경 항목, 변경 파일, 저장소, 예상 URL을 보여주고 중지
- 사용자 승인 전 commit, push, 재배포 금지

사용자 승인 후:
1. 토큰·비밀정보 확인
2. commit과 push
3. 재배포
4. HTTP 200 확인
5. Claude가 배포본 회귀 테스트
6. DEPLOYED, BLOCKED 또는 HITL_REQUIRED 기록
```

## MEMORY.md 템플릿

```markdown
# MEMORY.md

## Goal
- GitHub Pages용 반응형 프로페셔널 웹사이트와 Games/지렁이 게임 완성 및 배포

## Scope
- In: 정적 HTML/CSS/JS, 반응형 UI, Games, 키보드·터치 게임, GitHub Pages
- Out: 백엔드, DB, 로그인, 결제, 승인 없는 외부 API·프레임워크

## Execution
- Mode: CODEX_WORKER + CLAUDE_VERIFIER
- Claude model: 미확인
- Last test: 미실행
- Fallback: Claude 사용 불가 시에만 CODEX_FALLBACK

## Current State
- Status: READY
- Completed: 없음
- Next: Step 1에서 추천한 첫 루프
- Retry: 0
- Fingerprint: 없음
- Blocker: 없음
- Last good commit / URL: 없음

## Acceptance
- 정적 파일 정상 로드, 콘솔 오류 없음, 375/768/1440px 정상
- 내비게이션·Games·게임 핵심 기능·키보드·터치 정상
- GitHub Pages HTTP 200과 배포본 회귀 테스트 통과

## Guardrails
- 확인되지 않은 개인 정보 생성·기존 콘텐츠 임의 삭제 금지
- 테스트 삭제·완화, 기능 제거 우회, 대규모 재작성 금지
- 백엔드·외부 서비스·프레임워크 임의 추가 금지
- 토큰 출력·로그·코드·문서·Git 저장 금지

## Retry / HITL
- 오류당 최대 3회, 동일 fingerprint 2회면 중지
- 한 Retry에는 원인 하나와 최소 파일만 수정
- 콘텐츠 불명확, 요구 충돌, 권한·배포 설정 문제는 HITL_REQUIRED

## Recent Loops
| Loop | 상태 | 실행 모드·모델 | 변경 파일 | Claude 테스트 | Retry | 다음 작업 |
|---|---|---|---|---|---:|---|
| - | READY | 미확인 | - | 미실행 | 0 | 첫 루프 선택 |

## Deployment
- Repository: https://github.com/[username]/[username].github.io
- URL: https://[username].github.io
- Approval: 미승인
```
