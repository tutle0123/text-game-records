# 공통 텍스트게임 기록장 템플릿 — v2.0

새로운 세계관이나 게임을 추가할 때에도 **같은 구조와 같은 메뉴**를 사용합니다.

## 한 게임을 만들 때의 과정

1. 고유한 `worldId`와 `game.id`를 정합니다. 번호는 삭제한 게임이 있어도 재사용하지 않습니다.
2. `worlds/<worldId>/game-<게임번호>-<주인공 이름>-<동명이인번호>/` 폴더를 만듭니다.
3. 해당 폴더에 `templates/game/index.html`을 복사합니다. 디자인은 `state.json`의 `game.theme`으로 지정합니다.
4. `templates/state.example.json`을 `state.json`, `templates/history.example.json`을 `history.json`으로 복사하고 내용과 인물 ID를 채웁니다.
5. `catalog.json`에 게임 링크를 추가합니다.
6. 파일을 갱신할 때마다 두 JSON의 형식과 인물·업무 참조 ID를 점검합니다.

## 고정되는 항목

현재 상황 / 플레이어 / 등장인물 / 사건 연대기 / 진행 중인 업무 / 세계 상태 / 관계도 / 장소·조직 / 미공개 정보 / 설정·규칙.

`assets/dossier.js`와 `assets/dossier.css`가 공통 페이지에 사용됩니다. 개별 게임에서 독자적으로 메뉴를 삭제하거나 필드명을 바꾸면 안 됩니다. 테마는 `data-theme`으로 구별합니다. 현재 `classified`(바르도니아)·`joseon`·`neutral` 테마가 포함되어 있습니다. 필요하면 테마의 디자인만 추가할 수 있습니다.

## 데이터 규격

- `game-state.schema.json`: 게임 상태 전반의 JSON Schema
- `history.schema.json`: 사건 연대기 JSON Schema
- `state.example.json` 및 `history.example.json`: 새 게임 시작 샘플
- `game/index.html`: 모든 게임이 공유하는 표시용 HTML 골격

인물은 `people[].id`로 구분하며 이름은 식별자로 사용하지 않습니다. 동명·개명에도 ID를 유지합니다.
업무는 `tasks[].id`, 관계는 `relationships[].id`, 사건은 `history.events[].id`를 사용합니다.

인물 상세 카드의 **현재 활동**과 **장기간 이어지는 업무**는 별개입니다. 관계는 양방향으로 추측하지 않고 `fromId`에서 `toId`로 향하는 태도만 기술합니다. 변화는 `changes[]`에 누적합니다. 현재 관계를 덮어쓸 때도 원인을 지우지 않습니다.

정보가 없으면 `null`, 빈 배열 또는 '미정'을 사용하고, **의도적으로 확정된 설정을 지어내지 않습니다**. 이 사이트는 읽기 전용입니다. 실질 데이터 수정은 GitHub에 커밋해야 반영됩니다.

바르도니아 #001의 초기 사례: `worlds/bardonia/game-001-berezin-001/`.
