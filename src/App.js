import { useState, useEffect } from "react";
import { QRCodeCanvas } from 'qrcode.react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── 기본값 ──
const DEFAULT_LINKS = [
  { label: "슬랙 사용 가이드", emoji: "💬", url: "", order_index: 0 },
  { label: "노션 워크스페이스", emoji: "📒", url: "", order_index: 1 },
  { label: "자기소개 가이드", emoji: "👋", url: "", order_index: 2 },
  { label: "생활안내문", emoji: "📋", url: "", order_index: 3 },
];

const DEFAULT_TEMPLATES = {
  default: {
    name: "기본 온보딩 템플릿",
    intro: "",
    outro: "",
    steps: [
      { label: "1단계: 계정 접속 및 커뮤니케이션 설정", items: [
        { text: "구글 계정 로그인 후 메일함 확인", done: false, links: [] },
        { text: "슬랙 프로필, 표시 이름, 이모티콘 설정", done: false, links: [] },
        { text: "#0_all_축하 채널에 인사 및 자기소개 남기기", done: false, links: [] },
        { text: "슬랙 사용 가이드 확인", done: false, links: [] },
      ]},
      { label: "2단계: 기본 업무 환경 설정", items: [
        { text: "복합기 드라이버 설치 및 연결", done: false, links: [] },
        { text: "캘린더 설정", done: false, links: [] },
        { text: "이메일 서명 설정", done: false, links: [] },
        { text: "플렉스 설정 (계정/정보/직인/근무시간/구글캘린더 연동)", done: false, links: [] },
        { text: "플렉스 - 근로계약서 서명", done: false, links: [] },
      ]},
      { label: "3단계: 근무 시간 확정 및 정보 업데이트", items: [
        { text: "출근 시간 결정 및 플렉스 근무 시간 업데이트", done: false, links: [] },
        { text: "근무 시간 변경 시 hr_인사운영 태그해 알리기", done: false, links: [] },
        { text: "필요한 업무 툴 있으면 #_hr_문의 채널에 문의", done: false, links: [] },
      ]},
      { label: "4단계: 인사 및 행정 절차", items: [
        { text: "증명사진 1장 제출 (사원증/시스템 등록용)", done: false, links: [] },
        { text: "일상 사진 1장 제출 (팀 소개용, 선택)", done: false, links: [] },
      ]},
      { label: "5단계: 사내 문화 적응 및 교육", items: [
        { text: "생활안내문 나머지 부분 정독", done: false, links: [] },
        { text: "[필독] 출퇴근, 근태 수정 방법 확인", done: false, links: [] },
        { text: "[필독] AI검색: 슬랙 메시지+생활안내문 확인", done: false, links: [] },
        { text: "Chat GPT 교육 영상 시청 및 과제 제출", done: false, links: [] },
      ]},
      { label: "6단계: 퇴근 전 업무 마무리", items: [
        { text: "데일리 리뷰 작성 (오늘 진행 내용 + 느낀 점)", done: false, links: [] },
      ]},
    ]
  },
  global: {
    name: "글로벌스쿼드 템플릿",
    intro: "",
    outro: "",
    steps: [
      { label: "1단계: 계정 접속 및 커뮤니케이션 설정", items: [
        { text: "구글 계정 로그인 후 메일함 확인", done: false, links: [] },
        { text: "슬랙 프로필, 표시 이름, 이모티콘 설정", done: false, links: [] },
        { text: "#0_all_축하 채널에 인사 및 자기소개 남기기", done: false, links: [] },
        { text: "슬랙 사용 가이드 확인", done: false, links: [] },
        { text: "글로벌 채널 참여 (#4_글로벌_문의)", done: false, links: [] },
      ]},
      { label: "2단계: 기본 업무 환경 설정", items: [
        { text: "복합기 드라이버 설치 및 연결", done: false, links: [] },
        { text: "캘린더 설정", done: false, links: [] },
        { text: "이메일 서명 설정", done: false, links: [] },
        { text: "플렉스 설정 (계정/정보/직인/근무시간/구글캘린더 연동)", done: false, links: [] },
        { text: "플렉스 - 근로계약서 서명", done: false, links: [] },
      ]},
      { label: "3단계: 근무 시간 확정 및 정보 업데이트", items: [
        { text: "출근 시간 결정 및 플렉스 근무 시간 업데이트", done: false, links: [] },
        { text: "근무 시간 변경 시 hr_인사운영 태그해 알리기", done: false, links: [] },
      ]},
      { label: "4단계: 인사 및 행정 절차", items: [
        { text: "증명사진 1장 제출 (사원증/시스템 등록용)", done: false, links: [] },
        { text: "일상 사진 1장 제출 (팀 소개용, 선택)", done: false, links: [] },
      ]},
      { label: "5단계: 사내 문화 적응 및 교육", items: [
        { text: "생활안내문 나머지 부분 정독", done: false, links: [] },
        { text: "[필독] 출퇴근, 근태 수정 방법 확인", done: false, links: [] },
        { text: "[필독] AI검색: 슬랙 메시지+생활안내문 확인", done: false, links: [] },
        { text: "Chat GPT 교육 영상 시청 및 과제 제출", done: false, links: [] },
        { text: "글로벌 업무 프로세스 문서 확인", done: false, links: [] },
      ]},
      { label: "6단계: 퇴근 전 업무 마무리", items: [
        { text: "데일리 리뷰 작성 (오늘 진행 내용 + 느낀 점)", done: false, links: [] },
      ]},
    ]
  }
};

function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return { isMobile: width < 640 };
}

const normalizeItem = (item) => {
  const { link, ...rest } = item;
  return { desc: "", ...rest, links: item.links ?? (link ? [{ label: "링크", url: link }] : []), _dndId: item._dndId || `item-${Math.random()}` };
};
const normalizeSteps = (steps) => steps.map(s => ({ ...s, items: s.items.map(normalizeItem) }));
const normalizeTemplate = (t) => ({ intro: "", outro: "", ...t, steps: normalizeSteps(t.steps) });
const cloneSteps = (steps) => normalizeSteps(steps).map(s => ({ ...s, items: s.items.map(i => ({ ...i, links: [...(i.links||[])] })) }));

const DEPT_GROUPS = [
  { group: "글로벌본부", depts: ["CIS스쿼드", "글로벌스쿼드", "IMEA스쿼드", "동남아스쿼드", "남미스쿼드", "중화권스쿼드", "일본스쿼드"] },
  { group: "국내본부", depts: ["모공잡티스쿼드", "더비타스쿼드", "국내MD스쿼드", "지우개스쿼드", "노니스쿼드", "D2C스쿼드", "국내소셜미디어셀"] },
  { group: "브랜드본부", depts: ["브랜드셀-BM팀", "브랜드셀-BX팀", "CX셀", "공식몰셀"] },
  { group: "경영기획본부", depts: ["회계셀", "SCM셀", "HR셀", "테크셀", "사업지원", "사업기획"] },
];

function calcProgress(steps) {
  const all = steps.flatMap(s => s.items);
  if (!all.length) return 0;
  return Math.round(all.filter(i => i.done).length / all.length * 100);
}

function ProgressBar({ pct, height = 8 }) {
  const color = pct === 100 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ background: "#e2e8f0", borderRadius: 99, height, width: "100%" }}>
      <div style={{ width: `${pct}%`, background: color, height, borderRadius: 99, transition: "width .5s" }} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#94a3b8", fontSize: 14, background: "#f8fafc" }}>
      불러오는 중...
    </div>
  );
}

const withDndId = (items) => items.map(item => ({ ...item, _dndId: item._dndId || `dnd-${Math.random()}` }));

const LIGHT_INPUT = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: "6px 10px",
  color: "#0f172a",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};

function SortableLinkCard({ id, link, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#cbd5e1", fontSize: 20, flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>
        <input value={link.emoji} onChange={e => onEdit("emoji", e.target.value)} style={{ ...LIGHT_INPUT, width: 48, textAlign: "center", fontSize: 18 }} />
        <input value={link.label} onChange={e => onEdit("label", e.target.value)} style={{ ...LIGHT_INPUT, flex: 1 }} placeholder="버튼 이름" />
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 18, flexShrink: 0, padding: "0 4px" }}>✕</button>
      </div>
      <input value={link.url} onChange={e => onEdit("url", e.target.value)} style={LIGHT_INPUT} placeholder="https://..." />
    </div>
  );
}

function SortableCheckItem({ id, item, ii, onEditItem, onRemoveItem, onSetItemLinks }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const itemLinks = item.links || [];
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, display: "flex", flexDirection: "column", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#cbd5e1", fontSize: 16, flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>
        <input value={item.text} onChange={e => onEditItem(ii, "text", e.target.value)} style={{ ...LIGHT_INPUT, flex: 1 }} placeholder="항목 내용" />
        <button onClick={() => onRemoveItem(ii)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16, flexShrink: 0, padding: "0 4px" }}>✕</button>
      </div>
      <textarea value={item.desc || ""} onChange={e => onEditItem(ii, "desc", e.target.value)}
        placeholder="설명(선택)"
        style={{ ...LIGHT_INPUT, fontSize: 12, resize: "vertical", minHeight: 48, fontFamily: "inherit", color: "#64748b" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {itemLinks.map((lnk, li) => (
          <div key={li} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>🔗</span>
            <input value={lnk.label} onChange={e => onSetItemLinks(ii, itemLinks.map((l, i) => i === li ? { ...l, label: e.target.value } : l))}
              style={{ ...LIGHT_INPUT, width: 90, fontSize: 12 }} placeholder="버튼명" />
            <input value={lnk.url} onChange={e => onSetItemLinks(ii, itemLinks.map((l, i) => i === li ? { ...l, url: e.target.value } : l))}
              style={{ ...LIGHT_INPUT, flex: 1, fontSize: 12 }} placeholder="https://..." />
            <button onClick={() => onSetItemLinks(ii, itemLinks.filter((_, i) => i !== li))}
              style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: "0 2px" }}>✕</button>
          </div>
        ))}
        <button onClick={() => onSetItemLinks(ii, [...itemLinks, { label: "링크", url: "" }])}
          style={{ background: "none", border: "1px dashed #e2e8f0", borderRadius: 6, padding: "4px 8px", color: "#94a3b8", cursor: "pointer", fontSize: 11, alignSelf: "flex-start" }}>
          + 링크 추가
        </button>
      </div>
    </div>
  );
}

function SortableStepCard({ id, step, si, onEditLabel, onEditStepDesc, onRemoveStep, onEditItem, onRemoveItem, onAddItem, onSetItemLinks, onMoveItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center", background: "#f8fafc" }}>
        <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#cbd5e1", fontSize: 20, flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>
        <input value={step.label} onChange={e => onEditLabel(e.target.value)} style={{ ...LIGHT_INPUT, flex: 1, fontWeight: 700 }} />
        <button onClick={onRemoveStep} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ef4444", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>단계 삭제</button>
      </div>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9" }}>
        <textarea value={step.desc || ""} onChange={e => onEditStepDesc(e.target.value)}
          placeholder="이 단계에 대한 설명(선택) — 입사자 화면에 표시됩니다"
          style={{ ...LIGHT_INPUT, fontSize: 12, resize: "vertical", minHeight: 44, fontFamily: "inherit", color: "#64748b" }} />
      </div>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
          if (active.id !== over?.id) {
            const oldIdx = step.items.findIndex(it => it._dndId === active.id);
            const newIdx = step.items.findIndex(it => it._dndId === over.id);
            if (oldIdx !== -1 && newIdx !== -1) onMoveItem(oldIdx, newIdx);
          }
        }}>
          <SortableContext items={step.items.map(it => it._dndId || `item-${Math.random()}`)} strategy={verticalListSortingStrategy}>
            {step.items.map((item, ii) => (
              <SortableCheckItem key={item._dndId || ii} id={item._dndId || `item-${ii}`} item={item} ii={ii}
                onEditItem={onEditItem} onRemoveItem={onRemoveItem} onSetItemLinks={onSetItemLinks} />
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={onAddItem} style={{ background: "none", border: "1px dashed #e2e8f0", borderRadius: 8, padding: "8px", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>+ 항목 추가</button>
      </div>
    </div>
  );
}

function SortableDeptItem({ id, name, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <span {...attributes} {...listeners} style={{ cursor: "grab", color: "#cbd5e1", fontSize: 16, userSelect: "none", flexShrink: 0 }}>⠿</span>
      <input value={name} onChange={e => onEdit(e.target.value)} style={{ ...LIGHT_INPUT, flex: 1 }} placeholder="스쿼드/셀 이름" />
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>✕</button>
    </div>
  );
}

// ── 템플릿 관리 뷰 ──
function TemplateManager({ links, templates, onSaveLinks, onSaveTemplates, onDeleteTemplate }) {
  const [tab, setTab] = useState("links");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editLinks, setEditLinks] = useState(withDndId(links.map(l => ({ ...l }))));
  const [editTemplates, setEditTemplates] = useState(
    Object.fromEntries(Object.entries(templates).map(([k, t]) => {
      const nt = normalizeTemplate(t);
      return [k, { ...nt, steps: withDndId(nt.steps.map(s => ({ ...s, items: s.items.map(i => ({ ...i, links: [...(i.links||[])] })) }))) }];
    }))
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const addTemplate = () => {
    if (!newTemplateName.trim()) return;
    const key = `tmpl_${Date.now()}`;
    setEditTemplates(prev => ({ ...prev, [key]: { name: newTemplateName.trim(), steps: [] } }));
    setNewTemplateName("");
    setShowAddTemplate(false);
    setTab(key);
  };

  const deleteTemplate = async (key) => {
    if (!window.confirm(`"${editTemplates[key].name}" 템플릿을 삭제할까요?\n이 템플릿을 사용 중인 입사자의 체크리스트는 유지됩니다.`)) return;
    const newTemplates = Object.fromEntries(Object.entries(editTemplates).filter(([k]) => k !== key));
    setEditTemplates(newTemplates);
    setTab("links");
    await onDeleteTemplate(key);
  };

  const setLink = (i, field, val) => setEditLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const setItemField = (tKey, si, ii, field, val) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: prev[tKey].steps.map((s, sIdx) =>
          sIdx !== si ? s : { ...s, items: s.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, [field]: val }) }
        )
      }
    }));

  const setStepLabel = (tKey, si, val) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: { ...prev[tKey], steps: prev[tKey].steps.map((s, sIdx) => sIdx !== si ? s : { ...s, label: val }) }
    }));

  const addItem = (tKey, si) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: prev[tKey].steps.map((s, sIdx) =>
          sIdx !== si ? s : { ...s, items: [...s.items, { text: "", done: false, links: [] }] }
        )
      }
    }));

  const setStepDesc = (tKey, si, val) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: { ...prev[tKey], steps: prev[tKey].steps.map((s, sIdx) => sIdx !== si ? s : { ...s, desc: val }) }
    }));

  const setItemLinks = (tKey, si, ii, newLinks) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: prev[tKey].steps.map((s, sIdx) =>
          sIdx !== si ? s : { ...s, items: s.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, links: newLinks }) }
        )
      }
    }));

  const removeItem = (tKey, si, ii) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: prev[tKey].steps.map((s, sIdx) =>
          sIdx !== si ? s : { ...s, items: s.items.filter((_, iIdx) => iIdx !== ii) }
        )
      }
    }));

  const moveItem = (tKey, si, oldIdx, newIdx) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: prev[tKey].steps.map((s, sIdx) =>
          sIdx !== si ? s : { ...s, items: arrayMove(s.items, oldIdx, newIdx) }
        )
      }
    }));

  const addStep = (tKey) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: {
        ...prev[tKey],
        steps: [...prev[tKey].steps, { label: `${prev[tKey].steps.length + 1}단계: 새 단계`, items: [], _dndId: `dnd-${Math.random()}` }]
      }
    }));

  const removeStep = (tKey, si) =>
    setEditTemplates(prev => ({
      ...prev,
      [tKey]: { ...prev[tKey], steps: prev[tKey].steps.filter((_, sIdx) => sIdx !== si) }
    }));

  const handleSave = async () => {
    setSaving(true);
    await onSaveLinks(editLinks);
    await onSaveTemplates(editTemplates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TAB_STYLE = (active) => ({
    padding: "7px 16px",
    borderRadius: 8,
    border: active ? "none" : "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: active ? "#3b82f6" : "#fff",
    color: active ? "#fff" : "#64748b",
    boxShadow: active ? "0 1px 3px rgba(59,130,246,0.25)" : "none",
  });

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button style={TAB_STYLE(tab === "links")} onClick={() => setTab("links")}>🔗 가이드 링크</button>
        {Object.entries(editTemplates).map(([key, t]) => (
          <button key={key} style={TAB_STYLE(tab === key)} onClick={() => setTab(key)}>{t.name}</button>
        ))}
        {showAddTemplate ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTemplate()}
              placeholder="템플릿 이름" autoFocus
              style={{ background: "#fff", border: "1px solid #3b82f6", borderRadius: 8, padding: "6px 10px", color: "#0f172a", fontSize: 13, width: 140, outline: "none" }} />
            <button onClick={addTemplate}
              style={{ background: "#3b82f6", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 13 }}>추가</button>
            <button onClick={() => { setShowAddTemplate(false); setNewTemplateName(""); }}
              style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "6px 8px", color: "#64748b", cursor: "pointer", fontSize: 13 }}>취소</button>
          </div>
        ) : (
          <button onClick={() => setShowAddTemplate(true)}
            style={{ background: "#fff", border: "1px dashed #bfdbfe", borderRadius: 8, padding: "6px 14px", color: "#3b82f6", cursor: "pointer", fontSize: 13 }}>
            + 템플릿 추가
          </button>
        )}
      </div>

      {tab === "links" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>입사자 화면 상단에 표시되는 바로가기 버튼의 링크를 설정합니다. ⠿ 를 드래그해서 순서를 바꿀 수 있어요.</div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (active.id !== over?.id) {
              setEditLinks(prev => {
                const oldIdx = prev.findIndex(l => l._dndId === active.id);
                const newIdx = prev.findIndex(l => l._dndId === over.id);
                return arrayMove(prev, oldIdx, newIdx);
              });
            }
          }}>
            <SortableContext items={editLinks.map(l => l._dndId)} strategy={verticalListSortingStrategy}>
              {editLinks.map((l, i) => (
                <SortableLinkCard key={l._dndId} id={l._dndId} link={l}
                  onEdit={(field, val) => setLink(i, field, val)}
                  onRemove={() => setEditLinks(prev => prev.filter((_, idx) => idx !== i))} />
              ))}
            </SortableContext>
          </DndContext>
          <button onClick={() => setEditLinks(prev => [...prev, { label: "새 링크", emoji: "🔗", url: "", _dndId: `dnd-${Math.random()}` }])}
            style={{ background: "#fff", border: "1px dashed #bfdbfe", borderRadius: 10, padding: "10px", color: "#3b82f6", cursor: "pointer", fontSize: 13 }}>
            + 링크 추가
          </button>
        </div>
      )}

      {tab !== "links" && editTemplates[tab] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>📌 템플릿 이름</div>
            <input value={editTemplates[tab].name || ""} placeholder="템플릿 이름"
              onChange={e => setEditTemplates(prev => ({ ...prev, [tab]: { ...prev[tab], name: e.target.value } }))}
              style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", color: "#0f172a", fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600, marginBottom: 8 }}>✏️ 시작 멘트 (입사자 화면 맨 위에 표시)</div>
            <textarea value={editTemplates[tab].intro || ""} placeholder="예) 셀리맥스에 오신 것을 환영해요! 아래 체크리스트를 순서대로 완료해주세요 😊"
              onChange={e => setEditTemplates(prev => ({ ...prev, [tab]: { ...prev[tab], intro: e.target.value } }))}
              style={{ width: "100%", background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 12px", color: "#1e40af", fontSize: 13, resize: "vertical", minHeight: 72, boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (active.id !== over?.id) {
              setEditTemplates(prev => {
                const steps = prev[tab].steps;
                const oldIdx = steps.findIndex(s => s._dndId === active.id);
                const newIdx = steps.findIndex(s => s._dndId === over.id);
                return { ...prev, [tab]: { ...prev[tab], steps: arrayMove(steps, oldIdx, newIdx) } };
              });
            }
          }}>
            <SortableContext items={editTemplates[tab].steps.map(s => s._dndId)} strategy={verticalListSortingStrategy}>
              {editTemplates[tab].steps.map((step, si) => (
                <SortableStepCard key={step._dndId} id={step._dndId} step={step} si={si} tKey={tab}
                  onEditLabel={(val) => setStepLabel(tab, si, val)}
                  onRemoveStep={() => removeStep(tab, si)}
                  onEditStepDesc={(val) => setStepDesc(tab, si, val)}
                  onEditItem={(ii, field, val) => setItemField(tab, si, ii, field, val)}
                  onRemoveItem={(ii) => removeItem(tab, si, ii)}
                  onAddItem={() => addItem(tab, si)}
                  onSetItemLinks={(ii, newLinks) => setItemLinks(tab, si, ii, newLinks)}
                  onMoveItem={(oldIdx, newIdx) => moveItem(tab, si, oldIdx, newIdx)} />
              ))}
            </SortableContext>
          </DndContext>
          <button onClick={() => addStep(tab)}
            style={{ background: "#fff", border: "1px dashed #bfdbfe", borderRadius: 10, padding: "10px", color: "#3b82f6", cursor: "pointer", fontSize: 13 }}>
            + 단계 추가
          </button>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginBottom: 8 }}>✏️ 마무리 멘트 (입사자 화면 맨 아래에 표시)</div>
            <textarea value={editTemplates[tab].outro || ""} placeholder="예) 첫날 고생 많으셨어요! 궁금한 점은 언제든지 @hr 에게 문의해주세요 🙌"
              onChange={e => setEditTemplates(prev => ({ ...prev, [tab]: { ...prev[tab], outro: e.target.value } }))}
              style={{ width: "100%", background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px", color: "#92400e", fontSize: 13, resize: "vertical", minHeight: 72, boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => deleteTemplate(tab)}
              style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 16px", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>
              🗑 이 템플릿 삭제
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ 저장되었습니다!</span>}
        <button onClick={handleSave} disabled={saving}
          style={{ background: saved ? "#16a34a" : "#3b82f6", border: "none", borderRadius: 10, padding: "11px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1, transition: "background .2s", boxShadow: "0 1px 3px rgba(59,130,246,0.3)" }}>
          {saving ? "저장 중..." : "💾 저장하기"}
        </button>
      </div>
    </div>
  );
}

// ── 입사자 추가 모달 ──
function AddModal({ onAdd, onClose, templates, deptGroups: dg }) {
  const groups = (dg && dg.length > 0) ? dg : DEPT_GROUPS;
  const [form, setForm] = useState({ name: "", phone: "", deptGroup: groups[0].group, dept: groups[0].depts[0] || "", joinDate: new Date().toISOString().slice(0, 10), templateKey: Object.keys(templates)[0] });
  const [adding, setAdding] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentGroup = groups.find(g => g.group === form.deptGroup) || groups[0];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>➕ 신규 입사자 추가</div>
        {[
          { label: "이름", key: "name", type: "text", placeholder: "홍길동" },
          { label: "핸드폰 번호", key: "phone", type: "tel", placeholder: "01000000000" },
          { label: "입사일", key: "joinDate", type: "date" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]} placeholder={f.placeholder || ""}
              onChange={e => set(f.key, e.target.value)}
              style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", color: "#0f172a", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>본부</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {groups.map(g => (
              <button key={g.group} onClick={() => { set("deptGroup", g.group); set("dept", g.depts[0] || ""); }}
                style={{ background: form.deptGroup === g.group ? "#3b82f6" : "#f8fafc", border: `1px solid ${form.deptGroup === g.group ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 8, padding: "5px 10px", color: form.deptGroup === g.group ? "#fff" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: form.deptGroup === g.group ? 700 : 400 }}>
                {g.group}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>스쿼드 / 셀</div>
          <select value={form.dept} onChange={e => set("dept", e.target.value)}
            style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", color: "#0f172a", fontSize: 13 }}>
            {currentGroup.depts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>온보딩 템플릿</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(templates).map(([key, t]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: form.templateKey === key ? "#eff6ff" : "#f8fafc", border: `1px solid ${form.templateKey === key ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 8, padding: "8px 12px" }}>
                <input type="radio" name="template" value={key} checked={form.templateKey === key} onChange={() => set("templateKey", key)} style={{ accentColor: "#3b82f6" }} />
                <div>
                  <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.steps.length}단계 · {t.steps.flatMap(s => s.items).length}개 항목</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px", color: "#64748b", cursor: "pointer", fontSize: 13 }}>취소</button>
          <button
            disabled={adding}
            onClick={async () => {
              if (!form.name.trim()) return alert("이름을 입력해주세요");
              setAdding(true);
              await onAdd({ ...form, steps: cloneSteps(templates[form.templateKey].steps) });
              onClose();
            }}
            style={{ flex: 2, background: "#3b82f6", border: "none", borderRadius: 8, padding: "10px", color: "#fff", cursor: adding ? "default" : "pointer", fontSize: 13, fontWeight: 700, opacity: adding ? 0.7 : 1, boxShadow: "0 1px 3px rgba(59,130,246,0.3)" }}>
            {adding ? "추가 중..." : "추가하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 입사자 정보 수정 모달 ──
function EditModal({ person, onUpdate, onClose, deptGroups: dg }) {
  const groups = (dg && dg.length > 0) ? dg : DEPT_GROUPS;
  const findGroup = () => groups.find(g => g.depts.includes(person.dept))?.group || groups[0].group;
  const [form, setForm] = useState({
    name: person.name || "",
    phone: person.phone || "",
    deptGroup: findGroup(),
    dept: person.dept || "",
    joinDate: person.join_date || person.joinDate || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentGroup = groups.find(g => g.group === form.deptGroup) || groups[0];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>✏️ 입사자 정보 수정</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>{person.name} 님의 정보를 수정합니다</div>
        {[
          { label: "이름", key: "name", type: "text", placeholder: "홍길동" },
          { label: "핸드폰 번호", key: "phone", type: "tel", placeholder: "01000000000" },
          { label: "입사일", key: "joinDate", type: "date" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]} placeholder={f.placeholder || ""}
              onChange={e => set(f.key, e.target.value)}
              style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", color: "#0f172a", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>본부</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {groups.map(g => (
              <button key={g.group} onClick={() => { set("deptGroup", g.group); set("dept", g.depts[0] || ""); }}
                style={{ background: form.deptGroup === g.group ? "#3b82f6" : "#f8fafc", border: `1px solid ${form.deptGroup === g.group ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 8, padding: "5px 10px", color: form.deptGroup === g.group ? "#fff" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: form.deptGroup === g.group ? 700 : 400 }}>
                {g.group}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>스쿼드 / 셀</div>
          <select value={form.dept} onChange={e => set("dept", e.target.value)}
            style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", color: "#0f172a", fontSize: 13 }}>
            {currentGroup.depts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px", color: "#64748b", cursor: "pointer", fontSize: 13 }}>취소</button>
          <button disabled={saving} onClick={async () => {
            if (!form.name.trim()) return alert("이름을 입력해주세요");
            setSaving(true);
            await onUpdate(person.id, { name: form.name, phone: form.phone, dept: form.dept, join_date: form.joinDate });
            onClose();
          }} style={{ flex: 2, background: "#3b82f6", border: "none", borderRadius: 8, padding: "10px", color: "#fff", cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 만족도 설문 폼 ──
function SurveyForm({ personId, existingSurvey, onSubmit }) {
  const [score, setScore] = useState(existingSurvey?.score || 0);
  const [feedback, setFeedback] = useState(existingSurvey?.feedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(!!existingSurvey);

  if (done) return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
      <div style={{ fontSize: 13, color: "#15803d", fontWeight: 700 }}>만족도 설문 제출 완료</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>소중한 의견 감사해요!</div>
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📝 온보딩 만족도 조사</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>오늘 온보딩은 어떠셨나요? 솔직한 의견이 큰 도움이 됩니다.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setScore(s)}
            style={{ background: "none", border: "none", fontSize: 32, cursor: "pointer", opacity: s <= score ? 1 : 0.2, transition: "opacity .15s", padding: 0 }}>
            ⭐
          </button>
        ))}
      </div>
      {score > 0 && <div style={{ textAlign: "center", fontSize: 12, color: "#f59e0b", marginBottom: 12, fontWeight: 600 }}>
        {["","별로였어요","아쉬웠어요","보통이었어요","좋았어요","아주 좋았어요!"][score]}
      </div>}
      <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
        placeholder="개선사항이나 좋았던 점을 자유롭게 적어주세요 (선택)"
        style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", color: "#0f172a", fontSize: 13, resize: "vertical", minHeight: 80, boxSizing: "border-box", fontFamily: "inherit" }} />
      <button disabled={score === 0 || submitting} onClick={async () => {
        setSubmitting(true);
        await onSubmit({ score, feedback });
        setDone(true);
      }} style={{ marginTop: 10, width: "100%", background: score === 0 ? "#f1f5f9" : "#3b82f6", border: "none", borderRadius: 8, padding: "11px", color: score === 0 ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 13, cursor: score === 0 ? "default" : "pointer", transition: "background .2s" }}>
        {submitting ? "제출 중..." : "설문 제출하기"}
      </button>
    </div>
  );
}

// ── 입사자 개인 뷰 ──
// ── QR 입장 페이지 ──
function OnboardGate() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) return setError("핸드폰 번호를 입력해주세요");
    setLoading(true);
    setError("");
    const { data } = await supabase.from('people').select('id').eq('phone', cleaned).maybeSingle();
    if (data) {
      navigate(`/person/${data.id}`);
    } else {
      setError("등록된 정보가 없습니다. HR 담당자에게 문의해주세요.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #eff6ff 0%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 32px", maxWidth: 360, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>👋</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8, lineHeight: 1.3 }}>셀리맥스에<br/>오신 걸 환영해요!</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 36, lineHeight: 1.8 }}>핸드폰 번호를 입력하면<br/>나의 온보딩 페이지로 이동해요</div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="01000000000"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ width: "100%", background: "#f8fafc", border: `2px solid ${error ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 14, padding: "16px", color: "#0f172a", fontSize: 18, boxSizing: "border-box", textAlign: "center", letterSpacing: 2, outline: "none", marginBottom: 8, fontFamily: "inherit" }}
        />
        {error && <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, lineHeight: 1.5 }}>{error}</div>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#93c5fd" : "#3b82f6", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", marginTop: 4, boxShadow: "0 4px 16px rgba(59,130,246,0.35)", transition: "background .2s" }}>
          {loading ? "확인 중..." : "입장하기 →"}
        </button>
        <div style={{ marginTop: 28, fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          문제가 있으신가요?<br/>HR 담당자에게 연락해주세요<br/><span style={{ color: "#0f172a", fontWeight: 700 }}>📞 010-5647-2610</span>
        </div>
      </div>
    </div>
  );
}

function PersonView({ person, links, templateMeta, survey, onBack, onToggle, onSubmitSurvey }) {
  const pct = calcProgress(person.steps);
  const allDone = pct === 100;
  const intro = templateMeta?.intro || "";
  const outro = templateMeta?.outro || "";
  const { isMobile } = useWindowSize();
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(person.steps.map((s, i) => [i, Math.round(s.items.filter(it => it.done).length / (s.items.length || 1) * 100) === 100]))
  );
  const toggleCollapse = (si) => setCollapsed(prev => ({ ...prev, [si]: !prev[si] }));
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: isMobile ? "16px 12px" : "24px 16px" }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0, fontWeight: 600 }}>← 돌아가기</button>}
      {allDone ? (
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>온보딩 완료!</div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
            {person.name} 님, 첫날 체크리스트를 모두 마치셨어요.<br />셀리맥스 팀과 함께하게 되어 정말 반가워요 😊
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: intro ? 16 : 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>안녕하세요, {person.name} 님 👋</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{person.dept} · 입사일 {person.joinDate || person.join_date}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ProgressBar pct={pct} height={10} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", minWidth: 36 }}>{pct}%</span>
          </div>
        </div>
      )}
      {intro && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#1e40af", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {intro}
        </div>
      )}
      {links.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {links.map((l, i) => (
            l.url
              ? <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 18 }}>{l.emoji}</span>
                  <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{l.label}</span>
                </a>
              : <div key={i} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                  <span style={{ fontSize: 18 }}>{l.emoji}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{l.label}</span>
                </div>
          ))}
        </div>
      )}
      {person.steps.map((step, si) => {
        const stepPct = Math.round(step.items.filter(i => i.done).length / (step.items.length || 1) * 100);
        const isCollapsed = collapsed[si];
        return (
          <div key={si} style={{ marginBottom: 12, background: "#fff", border: `1px solid ${stepPct === 100 ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div onClick={() => toggleCollapse(si)} style={{ padding: "12px 14px 10px", borderBottom: isCollapsed ? "none" : `1px solid #f1f5f9`, cursor: "pointer", background: stepPct === 100 ? "#f0fdf4" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCollapsed ? 0 : 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: stepPct === 100 ? "#15803d" : "#0f172a" }}>
                  {stepPct === 100 ? "✅" : "⏳"} {step.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{step.items.filter(i => i.done).length}/{step.items.length}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{isCollapsed ? "▼" : "▲"}</span>
                </div>
              </div>
              {!isCollapsed && <ProgressBar pct={stepPct} height={4} />}
            </div>
            {!isCollapsed && step.desc && (
              <div style={{ padding: "8px 14px", fontSize: 12, color: "#64748b", lineHeight: 1.6, whiteSpace: "pre-wrap", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                {step.desc}
              </div>
            )}
            {!isCollapsed && (
              <div style={{ padding: "8px 14px 12px" }}>
                {step.items.map((item, ii) => (
                  <div key={ii} style={{ padding: "8px 0", borderBottom: ii < step.items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div onClick={() => onToggle(person.id, si, ii)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.done ? "#22c55e" : "#d1d5db"}`, background: item.done ? "#22c55e" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", cursor: "pointer", minWidth: 22 }}>
                        {item.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span onClick={() => onToggle(person.id, si, ii)}
                        style={{ fontSize: 13, color: item.done ? "#94a3b8" : "#0f172a", textDecoration: item.done ? "line-through" : "none", flex: 1, cursor: "pointer" }}>
                        {item.text}
                      </span>
                      {(item.links?.length ? item.links : item.link ? [{ label: "링크", url: item.link }] : []).filter(l => l.url).map((lnk, li) => (
                        <a key={li} href={lnk.url} target="_blank" rel="noreferrer"
                          style={{ flexShrink: 0, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#2563eb", textDecoration: "none", whiteSpace: "nowrap" }}>
                          {lnk.label || "링크"} 🔗
                        </a>
                      ))}
                    </div>
                    {item.desc && (
                      <div style={{ marginTop: 4, marginLeft: 28, fontSize: 12, color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.desc}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {outro && (
        <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#92400e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {outro}
        </div>
      )}
      {onSubmitSurvey && (
        <div style={{ marginTop: 16 }}>
          <SurveyForm personId={person.id} existingSurvey={survey} onSubmit={onSubmitSurvey} />
        </div>
      )}
      <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
        문의사항은 슬랙 <span style={{ color: "#6366f1", fontWeight: 600 }}>#hr_문의</span> 채널에 <span style={{ color: "#6366f1", fontWeight: 600 }}>@hr_인사운영</span> 태그하시어 문의해주세요
      </div>
    </div>
  );
}

// ── 설정 뷰 ──
function SettingsView({ deptGroups, onSaveDeptGroups, links, templates, onSaveLinks, onSaveTemplates, onDeleteTemplate }) {
  const [settingsTab, setSettingsTab] = useState("templates");
  const TAB = (active) => ({
    background: active ? "#3b82f6" : "#fff",
    border: active ? "none" : "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "7px 16px",
    color: active ? "#fff" : "#64748b",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    boxShadow: active ? "0 1px 3px rgba(59,130,246,0.25)" : "none",
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [editDeptGroups, setEditDeptGroups] = useState(
    (deptGroups || DEPT_GROUPS).map(g => ({
      ...g, _id: `g-${Math.random()}`,
      depts: g.depts.map(d => ({ name: typeof d === "string" ? d : d.name, _id: `d-${Math.random()}` }))
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const toSave = editDeptGroups.map(g => ({ group: g.group, depts: g.depts.map(d => d.name) }));
    await onSaveDeptGroups(toSave);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>⚙️ 설정</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button style={TAB(settingsTab === "templates")} onClick={() => setSettingsTab("templates")}>📋 템플릿 관리</button>
        <button style={TAB(settingsTab === "team")} onClick={() => setSettingsTab("team")}>🏢 팀 관리</button>
        <button style={TAB(settingsTab === "qr")} onClick={() => setSettingsTab("qr")}>📱 QR코드</button>
      </div>
      {settingsTab === "templates" && (
        <TemplateManager links={links} templates={templates} onSaveLinks={onSaveLinks} onSaveTemplates={onSaveTemplates} onDeleteTemplate={onDeleteTemplate} />
      )}
      {settingsTab === "qr" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 28, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📱 신규입사자 QR코드</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>모든 신규입사자에게 동일한 QR코드를 제공합니다.<br/>스캔하면 핸드폰 번호 입력 후 본인 페이지로 이동해요.</div>
          <div style={{ justifyContent: "center", marginBottom: 20, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "inline-block" }}>
            <QRCodeCanvas id="qr-canvas" value={`${window.location.origin}/onboard`} size={200} level="H" />
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", margin: "16px 0", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", wordBreak: "break-all" }}>{window.location.origin}/onboard</div>
          <button onClick={() => {
            const canvas = document.getElementById('qr-canvas');
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = '온보딩QR.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          }} style={{ background: "#3b82f6", border: "none", borderRadius: 10, padding: "11px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 3px rgba(59,130,246,0.3)" }}>
            ⬇️ QR코드 다운로드
          </button>
        </div>
      )}
      {settingsTab === "team" && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>🏢 팀 관리</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>본부별 스쿼드/셀을 관리합니다. 입사자 추가 시 드롭다운에 반영됩니다.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {editDeptGroups.map((group, gi) => (
                <div key={group._id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <input value={group.group} onChange={e => setEditDeptGroups(prev => prev.map((g, i) => i === gi ? { ...g, group: e.target.value } : g))}
                      style={{ flex: 1, background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 12px", color: "#0f172a", fontSize: 14, fontWeight: 700 }} />
                    <button onClick={() => setEditDeptGroups(prev => prev.filter((_, i) => i !== gi))}
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 10px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>삭제</button>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button disabled={gi === 0} onClick={() => setEditDeptGroups(prev => { const a = [...prev]; [a[gi-1], a[gi]] = [a[gi], a[gi-1]]; return a; })}
                        style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 8px", color: gi === 0 ? "#cbd5e1" : "#64748b", cursor: gi === 0 ? "default" : "pointer", fontSize: 12 }}>↑</button>
                      <button disabled={gi === editDeptGroups.length - 1} onClick={() => setEditDeptGroups(prev => { const a = [...prev]; [a[gi], a[gi+1]] = [a[gi+1], a[gi]]; return a; })}
                        style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 8px", color: gi === editDeptGroups.length - 1 ? "#cbd5e1" : "#64748b", cursor: gi === editDeptGroups.length - 1 ? "default" : "pointer", fontSize: 12 }}>↓</button>
                    </div>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                    if (active.id !== over?.id) {
                      setEditDeptGroups(prev => prev.map((g, i) => {
                        if (i !== gi) return g;
                        const oldIdx = g.depts.findIndex(d => d._id === active.id);
                        const newIdx = g.depts.findIndex(d => d._id === over.id);
                        return { ...g, depts: arrayMove(g.depts, oldIdx, newIdx) };
                      }));
                    }
                  }}>
                    <SortableContext items={group.depts.map(d => d._id)} strategy={verticalListSortingStrategy}>
                      {group.depts.map((dept, di) => (
                        <SortableDeptItem key={dept._id} id={dept._id} name={dept.name}
                          onEdit={val => setEditDeptGroups(prev => prev.map((g, i) => i !== gi ? g : { ...g, depts: g.depts.map((d, j) => j !== di ? d : { ...d, name: val }) }))}
                          onRemove={() => setEditDeptGroups(prev => prev.map((g, i) => i !== gi ? g : { ...g, depts: g.depts.filter((_, j) => j !== di) }))} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <button onClick={() => setEditDeptGroups(prev => prev.map((g, i) => i !== gi ? g : { ...g, depts: [...g.depts, { name: "", _id: `d-${Math.random()}` }] }))}
                    style={{ marginTop: 8, background: "none", border: "1px dashed #e2e8f0", borderRadius: 8, padding: "5px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
                    + 스쿼드/셀 추가
                  </button>
                </div>
              ))}
              <button onClick={() => setEditDeptGroups(prev => [...prev, { group: "새 본부", _id: `g-${Math.random()}`, depts: [] }])}
                style={{ background: "#fff", border: "1px dashed #bfdbfe", borderRadius: 10, padding: "10px", color: "#3b82f6", cursor: "pointer", fontSize: 13 }}>
                + 본부 추가
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ 저장되었습니다!</span>}
            <button onClick={handleSave} disabled={saving}
              style={{ background: saved ? "#16a34a" : "#3b82f6", border: "none", borderRadius: 10, padding: "11px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 1px 3px rgba(59,130,246,0.3)" }}>
              {saving ? "저장 중..." : saved ? "✓ 저장됨" : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 만족도 대시보드 ──
function SatisfactionView({ surveys, people }) {
  if (!surveys.length) return (
    <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", paddingTop: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 14 }}>아직 제출된 설문이 없어요</div>
    </div>
  );
  const avg = (surveys.reduce((a, s) => a + s.score, 0) / surveys.length).toFixed(1);
  const dist = [1,2,3,4,5].map(s => ({ score: s, count: surveys.filter(sv => sv.score === s).length }));
  const max = Math.max(...dist.map(d => d.count), 1);
  const personMap = Object.fromEntries(people.map(p => [p.id, p]));
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>📊 만족도 현황</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: "18px 20px", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4, fontWeight: 500 }}>평균 점수</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#d97706" }}>⭐ {avg}</div>
          <div style={{ fontSize: 11, color: "#a16207" }}>총 {surveys.length}건 응답</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>점수 분포</div>
          {dist.map(d => (
            <div key={d.score} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#64748b", minWidth: 20 }}>{d.score}점</span>
              <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, height: 8 }}>
                <div style={{ width: `${(d.count / max) * 100}%`, background: "#f59e0b", height: 8, borderRadius: 4, transition: "width .4s" }} />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 16 }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...surveys].sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at)).map(sv => {
          const p = personMap[sv.person_id];
          return (
            <div key={sv.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{p?.name || "알 수 없음"}</span>
                  {p && <span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", borderRadius: 99, padding: "1px 8px" }}>{p.dept}</span>}
                </div>
                <span style={{ fontSize: 14, color: "#f59e0b" }}>{"⭐".repeat(sv.score)}</span>
              </div>
              {sv.feedback && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{sv.feedback}</div>}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{new Date(sv.submitted_at).toLocaleDateString('ko-KR')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 입사자 카드 ──
function PersonCard({ d, templates, copied, onSelect, onCopy, onDelete, onEdit }) {
  const pct = calcProgress(d.steps);
  const joinDate = d.join_date || d.joinDate;
  const dayDiff = joinDate ? Math.floor((new Date() - new Date(joinDate)) / 86400000) : null;
  const dayLabel = dayDiff !== null ? (dayDiff === 0 ? "D-Day" : dayDiff > 0 ? `D+${dayDiff}` : `D${dayDiff}`) : null;
  return (
    <div onClick={() => onSelect(d.id)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "box-shadow .15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{d.name}</span>
          <span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", borderRadius: 99, padding: "2px 9px" }}>{d.dept}</span>
          <span style={{ fontSize: 11, color: "#6366f1", background: "#f5f3ff", borderRadius: 99, padding: "2px 9px" }}>{templates[d.template_key || d.templateKey]?.name || "기본"}</span>
          {dayLabel && <span style={{ fontSize: 11, color: dayDiff <= 1 ? "#d97706" : "#94a3b8", background: dayDiff <= 1 ? "#fffbeb" : "#f8fafc", border: `1px solid ${dayDiff <= 1 ? "#fde68a" : "#e2e8f0"}`, borderRadius: 99, padding: "2px 9px", fontWeight: 600 }}>{dayLabel}</span>}
          {joinDate && <span style={{ fontSize: 11, color: "#94a3b8" }}>{joinDate}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button onClick={(e) => onCopy(e, d.id)}
            style={{ background: copied === d.id ? "#f0fdf4" : "#eff6ff", border: `1px solid ${copied === d.id ? "#bbf7d0" : "#bfdbfe"}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: copied === d.id ? "#16a34a" : "#2563eb", cursor: "pointer", whiteSpace: "nowrap" }}>
            {copied === d.id ? "✓ 복사됨" : "🔗 링크 복사"}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(d); }}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#64748b", cursor: "pointer" }}>✏️ 수정</button>
          <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`${d.name} 님을 삭제할까요?`)) onDelete(d.id); }}
            style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#ef4444", cursor: "pointer" }}>삭제</button>
          <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>보기 →</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <ProgressBar pct={pct} />
        <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#16a34a" : "#f59e0b", minWidth: 36 }}>{pct}%</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {d.steps.map((s, i) => {
          const sPct = Math.round(s.items.filter(it => it.done).length / (s.items.length || 1) * 100);
          return <span key={i} style={{ fontSize: 11, borderRadius: 6, padding: "2px 8px", background: sPct === 100 ? "#f0fdf4" : "#fff7ed", color: sPct === 100 ? "#15803d" : "#c2410c", border: `1px solid ${sPct === 100 ? "#bbf7d0" : "#fed7aa"}` }}>{i+1}단계 {sPct === 100 ? "✓" : `${sPct}%`}</span>;
        })}
      </div>
    </div>
  );
}

// ── HR 대시보드 뷰 ──
function HRView({ data, links, templates, deptGroups, onSelect, onAdd, onDelete, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterGroup, setFilterGroup] = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterTemplate, setFilterTemplate] = useState("전체");

  const totalDone = data.filter(d => calcProgress(d.steps) === 100).length;
  const avg = Math.round(data.reduce((a, d) => a + calcProgress(d.steps), 0) / (data.length || 1));

  const copyLink = (e, id) => {
    e.stopPropagation();
    const url = `${window.location.origin}/person/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const groupNames = ["전체", ...(deptGroups || []).map(g => g.group)];
  const templateNames = ["전체", ...Object.values(templates).map(t => t.name)];

  const filtered = data.filter(d => {
    const pct = calcProgress(d.steps);
    if (filterGroup !== "전체") {
      const grp = (deptGroups || []).find(g => g.group === filterGroup);
      if (!grp || !grp.depts.includes(d.dept)) return false;
    }
    if (filterStatus === "완료" && pct !== 100) return false;
    if (filterStatus === "진행중" && (pct === 0 || pct === 100)) return false;
    if (filterStatus === "미시작" && pct !== 0) return false;
    if (filterTemplate !== "전체") {
      const tmplName = templates[d.template_key || d.templateKey]?.name;
      if (tmplName !== filterTemplate) return false;
    }
    return true;
  });

  const active = filtered.filter(d => calcProgress(d.steps) < 100);
  const completed = filtered.filter(d => calcProgress(d.steps) === 100);

  const CHIP = (isActive) => ({
    background: isActive ? "#eff6ff" : "#f8fafc",
    border: `1px solid ${isActive ? "#bfdbfe" : "#e2e8f0"}`,
    borderRadius: 99,
    padding: "5px 12px",
    color: isActive ? "#2563eb" : "#64748b",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: isActive ? 700 : 400,
  });

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>신규입사자 온보딩 현황</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>총 {data.length}명 관리 중</div>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ background: "#3b82f6", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 1px 3px rgba(59,130,246,0.35)" }}>
          ➕ 입사자 추가
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "전체 인원", value: `${data.length}명`, icon: "👥" },
          { label: "온보딩 완료", value: `${totalDone}명`, sub: `${data.length ? Math.round(totalDone / data.length * 100) : 0}% 완료`, icon: "✅" },
          { label: "평균 진행률", value: `${avg || 0}%`, icon: "📈" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{c.value}</div>
            {c.sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 36, fontWeight: 600 }}>본부</span>
          {groupNames.map(g => <button key={g} style={CHIP(filterGroup === g)} onClick={() => setFilterGroup(g)}>{g}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 36, fontWeight: 600 }}>상태</span>
          {["전체","미시작","진행중","완료"].map(s => <button key={s} style={CHIP(filterStatus === s)} onClick={() => setFilterStatus(s)}>{s}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 36, fontWeight: 600 }}>템플릿</span>
          {templateNames.map(t => <button key={t} style={CHIP(filterTemplate === t)} onClick={() => setFilterTemplate(t)}>{t}</button>)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {active.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "20px 0" }}>조건에 맞는 입사자가 없어요</div>}
        {active.map(d => <PersonCard key={d.id} d={d} templates={templates} copied={copied} onSelect={onSelect} onCopy={copyLink} onDelete={onDelete} onEdit={setEditTarget} />)}
      </div>

      {completed.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowCompleted(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 18px", color: "#15803d", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}>
            <span>✅ 온보딩 완료 ({completed.length}명)</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#86efac" }}>{showCompleted ? "▲ 접기" : "▼ 펼치기"}</span>
          </button>
          {showCompleted && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {completed.map(d => <PersonCard key={d.id} d={d} templates={templates} copied={copied} onSelect={onSelect} onCopy={copyLink} onDelete={onDelete} onEdit={setEditTarget} />)}
            </div>
          )}
        </div>
      )}
      {showModal && <AddModal onAdd={onAdd} onClose={() => setShowModal(false)} templates={templates} deptGroups={deptGroups} />}
      {editTarget && <EditModal person={editTarget} onUpdate={onUpdate} onClose={() => setEditTarget(null)} deptGroups={deptGroups} />}
    </div>
  );
}

// ── 개인 URL 라우트 ──
function PersonRoute() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [links, setLinks] = useState([]);
  const [templateMeta, setTemplateMeta] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;
    async function load() {
      const [personRes, linksRes, surveyRes] = await Promise.all([
        supabase.from('people').select('*').eq('id', id).single(),
        supabase.from('links').select('*').order('order_index'),
        supabase.from('surveys').select('*').eq('person_id', id).maybeSingle(),
      ]);
      if (personRes.data) {
        setPerson(personRes.data);
        const tmplRes = await supabase.from('templates').select('intro,outro').eq('id', personRes.data.template_key).single();
        if (tmplRes.data) setTemplateMeta(tmplRes.data);
      }
      setLinks(linksRes.data || []);
      if (surveyRes.data) setSurvey(surveyRes.data);
      setLoading(false);
    }
    load();

    channel = supabase
      .channel(`person-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'people', filter: `id=eq.${id}` },
        (payload) => { setPerson(payload.new); }
      )
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id]);

  const toggleItem = async (personId, stepIdx, itemIdx) => {
    const newSteps = person.steps.map((s, si) =>
      si !== stepIdx ? s : { ...s, items: s.items.map((it, ii) => ii !== itemIdx ? it : { ...it, done: !it.done }) }
    );
    setPerson(p => ({ ...p, steps: newSteps }));
    await supabase.from('people').update({ steps: newSteps }).eq('id', personId);
  };

  const submitSurvey = async ({ score, feedback }) => {
    const { data } = await supabase.from('surveys').insert({ person_id: id, score, feedback }).select().single();
    if (data) setSurvey(data);
  };

  if (loading) return <LoadingScreen />;
  if (!person) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#94a3b8", fontSize: 14, background: "#f8fafc" }}>
      입사자를 찾을 수 없습니다.
    </div>
  );
  return <PersonView person={person} links={links} templateMeta={templateMeta} survey={survey} onToggle={toggleItem} onSubmitSurvey={submitSurvey} />;
}

// ── HR 앱 ──
function HRApp() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [templates, setTemplates] = useState({});
  const [data, setData] = useState([]);
  const [deptGroups, setDeptGroups] = useState(DEPT_GROUPS);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("hr");

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel('people-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'people' }, (payload) => {
        setData(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function seedData() {
    await supabase.from('links').insert(DEFAULT_LINKS.map(({ order_index, ...l }) => ({ ...l, order_index })));
    await supabase.from('templates').insert([
      { id: 'default', name: DEFAULT_TEMPLATES.default.name, steps: DEFAULT_TEMPLATES.default.steps },
      { id: 'global', name: DEFAULT_TEMPLATES.global.name, steps: DEFAULT_TEMPLATES.global.steps },
    ]);
    await supabase.from('people').insert([
      { name: "고유영", dept: "공식물셀", join_date: "2026-03-17", slack_id: "@goyuyoung", template_key: "default", steps: cloneSteps(DEFAULT_TEMPLATES.default.steps) },
      { name: "서미연", dept: "글로벌스쿼드", join_date: "2026-03-17", slack_id: "@seomiyeon", template_key: "global", steps: cloneSteps(DEFAULT_TEMPLATES.global.steps) },
      { name: "천서연", dept: "글로벌스쿼드", join_date: "2026-03-17", slack_id: "@cheonseoyeon", template_key: "global", steps: cloneSteps(DEFAULT_TEMPLATES.global.steps) },
      { name: "살타", dept: "CIS스쿼드", join_date: "2026-03-17", slack_id: "@salta", template_key: "default", steps: cloneSteps(DEFAULT_TEMPLATES.default.steps) },
    ]);
  }

  async function loadAll() {
    const [linksRes, templatesRes, peopleRes, configRes, surveysRes] = await Promise.all([
      supabase.from('links').select('*').order('order_index'),
      supabase.from('templates').select('*'),
      supabase.from('people').select('*').order('created_at'),
      supabase.from('config').select('value').eq('key', 'dept_groups').single(),
      supabase.from('surveys').select('*').order('submitted_at', { ascending: false }),
    ]);

    let linksData = linksRes.data || [];
    let templatesData = templatesRes.data || [];
    let peopleData = peopleRes.data || [];

    if (linksData.length === 0 && templatesData.length === 0) {
      await seedData();
      const [lr, tr, pr] = await Promise.all([
        supabase.from('links').select('*').order('order_index'),
        supabase.from('templates').select('*'),
        supabase.from('people').select('*').order('created_at'),
      ]);
      linksData = lr.data || [];
      templatesData = tr.data || [];
      peopleData = pr.data || [];
    }

    const templatesObj = {};
    templatesData.forEach(t => { templatesObj[t.id] = { name: t.name, steps: t.steps }; });

    if (configRes.data?.value) setDeptGroups(configRes.data.value);
    setLinks(linksData);
    setTemplates(templatesObj);
    setData(peopleData);
    setSurveys(surveysRes.data || []);
    setLoading(false);
  }

  const saveLinks = async (newLinks) => {
    const existingIds = links.map(l => l.id).filter(Boolean);
    if (existingIds.length > 0) {
      await supabase.from('links').delete().in('id', existingIds);
    }
    const toInsert = newLinks.map((l, i) => ({ label: l.label, emoji: l.emoji, url: l.url, order_index: i }));
    const { data: saved } = await supabase.from('links').insert(toInsert).select();
    setLinks(saved || newLinks);
  };

  const saveDeptGroups = async (newGroups) => {
    await supabase.from('config').upsert({ key: 'dept_groups', value: newGroups });
    setDeptGroups(newGroups);
  };

  const saveTemplates = async (newTemplates) => {
    await Promise.all(
      Object.entries(newTemplates).map(([id, t]) =>
        supabase.from('templates').upsert({ id, name: t.name, steps: t.steps })
      )
    );
    setTemplates(newTemplates);
  };

  const deleteTemplate = async (key) => {
    await supabase.from('templates').delete().eq('id', key);
    setTemplates(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
  };

  const deletePerson = async (id) => {
    await supabase.from('people').delete().eq('id', id);
    setData(prev => prev.filter(p => p.id !== id));
  };

  const updatePerson = async (id, fields) => {
    const { data: updated } = await supabase.from('people').update(fields).eq('id', id).select().single();
    if (updated) setData(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const addPerson = async (person) => {
    const { data: inserted } = await supabase.from('people').insert({
      name: person.name,
      phone: person.phone || '',
      dept: person.dept,
      join_date: person.joinDate,
      slack_id: '',
      template_key: person.templateKey,
      steps: person.steps,
    }).select().single();
    if (inserted) setData(prev => [...prev, inserted]);
  };

  const NAV_ITEMS = [
    { key: "hr", label: "🏠 홈" },
    { key: "satisfaction", label: "📊 만족도" },
    { key: "settings", label: "⚙️ 설정" },
  ];

  if (loading) return <LoadingScreen />;
  return (
    <>
      <div style={{ borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>셀리맥스 온보딩</span>
        <div style={{ display: "flex", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setView(item.key)}
              style={{ background: view === item.key ? "#eff6ff" : "transparent", border: "none", borderRadius: 8, padding: "7px 14px", color: view === item.key ? "#2563eb" : "#64748b", fontSize: 13, fontWeight: view === item.key ? 700 : 400, cursor: "pointer" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {view === "hr" && <HRView
        data={data}
        links={links}
        templates={templates}
        deptGroups={deptGroups}
        onSelect={(id) => navigate(`/person/${id}`)}
        onAdd={addPerson}
        onDelete={deletePerson}
        onUpdate={updatePerson}
      />}
      {view === "satisfaction" && <SatisfactionView surveys={surveys} people={data} />}
      {view === "settings" && <SettingsView
        deptGroups={deptGroups}
        onSaveDeptGroups={saveDeptGroups}
        links={links}
        templates={templates}
        onSaveLinks={saveLinks}
        onSaveTemplates={saveTemplates}
        onDeleteTemplate={deleteTemplate}
      />}
    </>
  );
}

// ── 루트 ──
export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
        <Routes>
          <Route path="/" element={<HRApp />} />
          <Route path="/onboard" element={<OnboardGate />} />
          <Route path="/person/:id" element={<PersonRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
