# 배포 파이프라인 (GitHub Actions → Supabase → Vercel)

```
PR 열기 ──▶ 앱 점검(tsc·build) ─┐
          └▶ DB 점검(빈 DB에 migrations 적용·lint) ─▶ 운영 DB 반영 예정(dry-run)
                                  │
main 머지 ──▶ 앱 점검 + DB 점검 ──▶ 운영 DB 마이그레이션 ──▶ Vercel 운영 배포 ──▶ /api/health 점검
매주 월 09:17 ──▶ 스키마 드리프트 감시 (대시보드 직접 변경 감지)
```

- PR 브랜치는 기존처럼 Vercel이 미리보기(Preview) 배포를 자동으로 만듭니다.
- 운영(main) 배포는 Vercel 자동배포를 끄고(`vercel.json` → `git.deploymentEnabled.main: false`) Actions가 **DB 마이그레이션 성공 후에만** 배포합니다.
- DB 변경은 반드시 `supabase/migrations/` 파일로: `npx supabase migration new <이름>` → SQL 작성 → PR.
  대시보드에서 직접 바꿨다면 `npx supabase db diff --linked -f <이름>` 으로 파일을 만들어 커밋.

## 최초 1회 설정

GitHub → Settings → Secrets and variables → Actions → New repository secret

| 이름 | 어디서 |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_DB_PASSWORD` | Supabase 프로젝트 → Project Settings → Database |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel 팀 Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel cjb-server 프로젝트 → Settings → General → Project ID |

GitHub → Settings → Environments → `production` 생성 (원하면 "Required reviewers"로 운영 반영 전 승인 단계 추가).

> 주의: 시크릿을 넣기 전에 이 변경을 main에 머지하면 운영 배포 단계가 실패합니다(기존 사이트는 그대로 유지).
