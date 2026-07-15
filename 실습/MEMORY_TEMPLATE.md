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
