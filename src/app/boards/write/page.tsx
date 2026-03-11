"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  CameraIcon,
  FontBoldIcon,
  FontItalicIcon,
  ImageIcon,
  Link2Icon,
  VideoIcon,
  Cross2Icon,
  QuestionMarkCircledIcon,
  EyeOpenIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import AuthModal from "@/components/auth/AuthModal";
import {
  boardsControllerGetBoards,
  useArticleControllerCreateArticle,
  BoardResponseDto,
  CreateArticleDto,
  awsControllerUploadFile,
  Image as UploadedImage,
} from "@rawfli/types";
import { isLoggedIn } from "@/lib/auth";
import styles from "./page.module.css";

export default function ArticleWritePage() {
  const router = useRouter();

  const [boardId, setBoardId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardResponseDto[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");

  const [imageMap, setImageMap] = useState<Record<string, { file: File; previewUrl: string }>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createArticle = useArticleControllerCreateArticle();

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthModalOpen(true);
      return;
    }
    boardsControllerGetBoards().then((res) => {
      const communityBoards = res.data.filter((b) => b.type === "community");
      setBoards(communityBoards);
    });
  }, []);


  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent((prev) => prev.slice(0, start) + text + prev.slice(end));

    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (!newFiles.length) return;

    const tempIds = newFiles.map(() => `img-${Math.random().toString(36).slice(2)}`);
    const previewUrls = newFiles.map((f) => URL.createObjectURL(f));

    setImageMap((prev) => {
      const next = { ...prev };
      tempIds.forEach((id, i) => { next[id] = { file: newFiles[i], previewUrl: previewUrls[i] }; });
      return next;
    });
    insertAtCursor(tempIds.map((id) => `\n![](${id})\n`).join(""));
  };

  const handleRemoveImage = (id: string) => {
    URL.revokeObjectURL(imageMap[id]?.previewUrl);
    setImageMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setContent((prev) => prev.replaceAll(`\n![](${id})\n`, "").replaceAll(`![](${id})`, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!boardId || !title.trim() || !content.trim()) return;
    setSubmitError(null);

    let finalContent = content.trim();
    const imageIds: string[] = [];


    const usedEntries = Object.entries(imageMap).filter(([id]) => finalContent.includes(`![](${id})`));

    if (usedEntries.length > 0) {
      try {
        const result = await awsControllerUploadFile({ images: usedEntries.map(([, v]) => v.file) });
        const uploaded = (result as unknown as { data: UploadedImage[] }).data;
        uploaded.forEach((img, i) => {
          finalContent = finalContent.replaceAll(`![](${usedEntries[i][0]})`, `![](${img.id})`);
          imageIds.push(img.id);
        });
      } catch {
        setSubmitError("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        return;
      }
    }

    const dto: CreateArticleDto = {
      title: title.trim(),
      content: finalContent,
      imageIds,
    };

    createArticle.mutate(
      { boardId, data: dto },
      {
        onSuccess: (res) => {
          const articleId = res.data.id;
          router.push(`/boards/${boardId}/articles/${articleId}`);
        },
        onError: () => {
          setSubmitError("게시글 등록에 실패했습니다. 로그인 상태를 확인해주세요.");
        },
      }
    );
  };

  const canSubmit = !!title.trim() && !!content.trim() && !createArticle.isPending;

  return (
    <div className={styles.page}>
      <HomeHeader />

      <AuthModal
        open={authModalOpen}
        mode="login"
        onClose={() => router.back()}
        onChangeMode={() => {}}
        onAuthSuccess={() => {
          setAuthModalOpen(false);
          boardsControllerGetBoards().then((res) => {
            const communityBoards = res.data.filter((b) => b.type === "community");
            setBoards(communityBoards);
          });
        }}
      />

      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>게시글 작성</h2>

            {boards.length > 0 && (
              <div className={styles.boardSelector}>
                {boards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    className={`${styles.boardChip} ${board.id === boardId ? styles.boardChipActive : ""}`}
                    onClick={() => setBoardId(board.id)}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              className={styles.titleInput}
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className={styles.editor}>
              <div className={styles.toolbar}>
                <button type="button" className={styles.toolbarButton} aria-label="굵게"
                  onClick={() => insertAtCursor("**굵게**")}>
                  <FontBoldIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="기울임"
                  onClick={() => insertAtCursor("*기울임*")}>
                  <FontItalicIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="링크"
                  onClick={() => insertAtCursor("[링크텍스트](url)")}>
                  <Link2Icon />
                </button>
                <div className={styles.toolbarDivider} />
                <button type="button" className={styles.toolbarButton} aria-label="이미지 추가"
                  onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="동영상">
                  <VideoIcon />
                </button>
                <div className={styles.toolbarDivider} />
                <button
                  type="button"
                  className={`${styles.toolbarButton} ${editorTab === "edit" ? styles.toolbarButtonActive : ""}`}
                  onClick={() => setEditorTab("edit")}
                  aria-label="편집"
                >
                  <Pencil2Icon />
                </button>
                <button
                  type="button"
                  className={`${styles.toolbarButton} ${editorTab === "preview" ? styles.toolbarButtonActive : ""}`}
                  onClick={() => setEditorTab("preview")}
                  aria-label="미리보기"
                >
                  <EyeOpenIcon />
                </button>
                <div style={{ marginLeft: "auto" }}>
                  <button type="button" className={styles.toolbarButton} aria-label="도움말">
                    <QuestionMarkCircledIcon />
                  </button>
                </div>
              </div>

              {editorTab === "edit" ? (
                <textarea
                  ref={textareaRef}
                  className={styles.contentTextarea}
                  placeholder="내용을 입력하세요... 이미지는 툴바의 이미지 버튼으로 추가하세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files); }}
                />
              ) : (
                <div className={styles.contentPreview}>
                  {content.trim() ? (
                    <ReactMarkdown
                      components={{
                        img: ({ src }: any) => {
                          const url = imageMap[src]?.previewUrl;
                          if (!url) return null;
                          return <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: "10px", margin: "8px 0", display: "block" }} />;
                        },
                        p: ({ children }) => <p style={{ margin: "0 0 1em" }}>{children}</p>,
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>미리볼 내용이 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => handleImageSelect(e.target.files)}
            />

            {Object.keys(imageMap).length > 0 && (
              <div className={styles.uploadSection}>
                <span className={styles.uploadLabel}>첨부된 사진 ({Object.keys(imageMap).length}장)</span>
                <div className={styles.imagePreviewList}>
                  {Object.entries(imageMap).map(([id, info]) => (
                    <div key={id} className={styles.imagePreviewItem}>
                      <img src={info.previewUrl} alt="첨부" />
                      <button
                        type="button"
                        className={styles.imageRemoveButton}
                        onClick={() => handleRemoveImage(id)}
                        aria-label="이미지 제거"
                      >
                        <Cross2Icon width={12} height={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.actions}>
              {submitError && (
                <p style={{ color: "var(--hot-badge-color, #ff4d4d)", fontSize: "0.875rem", marginRight: "auto" }}>
                  {submitError}
                </p>
              )}
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.submitButton}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                등록하기
              </button>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={`${styles.sidebarCardTitle} ${styles.sidebarCardTitleAccent}`}>
                <CameraIcon width={18} height={18} />
                작성 팁
              </h3>
              <ul className={styles.tipList}>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>01</span>
                  <p>선명한 고화질 사진은 커뮤니티 베스트에 선정될 확률이 높습니다.</p>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>02</span>
                  <p>사용한 장비 정보(바디, 렌즈, 설정값)를 공유해주시면 다른 회원들에게 큰 도움이 됩니다.</p>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>03</span>
                  <p>타인의 저작권을 존중하며, 직접 촬영한 사진만 업로드해 주세요.</p>
                </li>
              </ul>
            </div>

            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>커뮤니티 가이드</h3>
              <div className={styles.guideList}>
                <p>• 비방, 욕설, 광고성 게시글은 삭제될 수 있습니다.</p>
                <p>• 게시판 성격에 맞는 카테고리를 선택해 주세요.</p>
                <p>• 개인정보가 노출되지 않도록 주의해 주세요.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
