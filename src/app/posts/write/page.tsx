"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReloadIcon, UploadIcon } from "@radix-ui/react-icons";
import {
  awsControllerGetMyImages,
  awsControllerUploadFile,
  CreatePostDto,
  CreatePostPhotoDto,
  MyImageItemResponseDto,
  usePostsControllerCreatePost,
} from "@rawfli/types";
import AuthModal from "@/components/auth/AuthModal";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import PostWriteEditModal from "@/components/post/write/PostWriteEditModal";
import PostWritePhotoGrid from "@/components/post/write/PostWritePhotoGrid";
import { PhotoDraft, WriteTab } from "@/components/post/write/post-write.types";
import { createDraft, extractMyImages, parseOptionalNumber } from "@/components/post/write/post-write.utils";
import { getApiErrorMessage } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { extractUploadedImageIds } from "@/shared/utils/upload";
import styles from "./page.module.css";

const LEAVE_WARNING_MESSAGE = "임시저장이 없어 작성 중인 내용이 사라질 수 있습니다. 페이지를 나가시겠습니까?";

export default function PostWritePage() {
  const router = useRouter();
  const createPost = usePostsControllerCreatePost();

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WriteTab>("library");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [images, setImages] = useState<MyImageItemResponseDto[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PhotoDraft>>({});
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const imageById = useMemo(() => {
    return new Map(images.map((image) => [image.id, image]));
  }, [images]);

  const selectedImages = useMemo(() => {
    return selectedImageIds.map((id) => imageById.get(id)).filter((item): item is MyImageItemResponseDto => !!item);
  }, [selectedImageIds, imageById]);

  const editingImage = editingImageId ? imageById.get(editingImageId) : undefined;
  const editingDraft = editingImageId ? drafts[editingImageId] : undefined;

  const loadMyImages = async (silent = false): Promise<MyImageItemResponseDto[]> => {
    if (!silent) {
      setLoadingImages(true);
    }

    setLibraryError(null);
    try {
      const response = await awsControllerGetMyImages({ page: 1, limit: 200 });
      const fetched = extractMyImages(response);
      setImages(fetched);
      return fetched;
    } catch (error) {
      setLibraryError(getApiErrorMessage(error, "이미지 목록을 불러오지 못했습니다."));
      return [];
    } finally {
      if (!silent) {
        setLoadingImages(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthModalOpen(true);
      setLoadingImages(false);
      return;
    }

    void loadMyImages();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || publishing) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, publishing]);

  useEffect(() => {
    if (!editingImageId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingImageId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingImageId]);

  const confirmLeaveIfDirty = () => {
    if (!isDirty || publishing) return true;
    return window.confirm(LEAVE_WARNING_MESSAGE);
  };

  const handleAttemptLeave = () => {
    if (!confirmLeaveIfDirty()) return;
    router.back();
  };

  const ensureDraft = (image: MyImageItemResponseDto) => {
    setDrafts((prev) => {
      if (prev[image.id]) return prev;
      return {
        ...prev,
        [image.id]: createDraft(image),
      };
    });
  };

  const toggleSelect = (image: MyImageItemResponseDto) => {
    ensureDraft(image);
    setIsDirty(true);

    setSelectedImageIds((prev) => {
      if (prev.includes(image.id)) {
        return prev.filter((id) => id !== image.id);
      }
      return [...prev, image.id];
    });
  };

  const updateDraftField = (imageId: string, field: keyof PhotoDraft, value: string) => {
    setIsDirty(true);
    setDrafts((prev) => {
      const fallbackImage = imageById.get(imageId);
      const current = prev[imageId] ?? (fallbackImage ? createDraft(fallbackImage) : undefined);
      if (!current) return prev;

      return {
        ...prev,
        [imageId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const openEditor = (image: MyImageItemResponseDto) => {
    ensureDraft(image);
    setEditingImageId(image.id);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    if (validFiles.length === 0) {
      setSubmitError("jpg, png, webp 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setSubmitError(null);

    try {
      const uploadResponse = await awsControllerUploadFile({ images: validFiles });
      const uploadedIds = extractUploadedImageIds(uploadResponse);

      const refreshed = await loadMyImages(true);
      const refreshedMap = new Map(refreshed.map((image) => [image.id, image]));

      setSelectedImageIds((prev) => {
        const next = [...prev];
        for (const uploadedId of uploadedIds) {
          if (!refreshedMap.has(uploadedId)) continue;
          if (!next.includes(uploadedId)) next.push(uploadedId);
        }
        return next;
      });

      setDrafts((prev) => {
        const next = { ...prev };
        for (const uploadedId of uploadedIds) {
          const image = refreshedMap.get(uploadedId);
          if (!image) continue;
          if (!next[uploadedId]) {
            next[uploadedId] = createDraft(image);
          }
        }
        return next;
      });

      setIsDirty(true);
      setActiveTab("selected");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "이미지 업로드에 실패했습니다."));
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!isLoggedIn()) {
      setAuthModalOpen(true);
      return;
    }

    if (!title.trim() || !content.trim()) {
      setSubmitError("포스트 제목과 내용을 입력해주세요.");
      return;
    }

    if (selectedImageIds.length === 0) {
      setSubmitError("포스트에 포함할 작품을 최소 1개 선택해주세요.");
      return;
    }

    setPublishing(true);
    setSubmitError(null);

    try {
      const photos: CreatePostPhotoDto[] = [];
      for (const imageId of selectedImageIds) {
        const image = imageById.get(imageId);
        if (!image) continue;

        const draft = drafts[imageId] ?? createDraft(image);
        photos.push({
          imageId,
          description: draft.description.trim() || undefined,
          iso: parseOptionalNumber(draft.iso),
          aperture: parseOptionalNumber(draft.aperture),
          shutterSpeed: draft.shutterSpeed.trim() || undefined,
          focalLength: parseOptionalNumber(draft.focalLength),
          cameraBrand: draft.cameraBrand.trim() || undefined,
          cameraModel: draft.cameraModel.trim() || undefined,
          lensBrand: draft.lensBrand.trim() || undefined,
          lensModel: draft.lensModel.trim() || undefined,
        });
      }

      const dto: CreatePostDto = {
        title: title.trim(),
        content: content.trim(),
        photos,
      };

      const response = await createPost.mutateAsync({ data: dto });
      setIsDirty(false);
      router.push(`/posts/${response.data.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "포스트 발행에 실패했습니다."));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={styles.page}>
      <HomeHeader activeNav="posts" />

      <AuthModal
        open={authModalOpen}
        mode="login"
        onClose={handleAttemptLeave}
        onChangeMode={() => {}}
        onAuthSuccess={() => {
          setAuthModalOpen(false);
          void loadMyImages();
        }}
      />

      <main className={styles.main}>
        <div className={styles.actionBar}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleAttemptLeave}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.publishButton}
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? "발행 중..." : "발행하기"}
          </button>
        </div>

        <div className={styles.workspace}>
          <aside className={styles.sidePanel}>
            <section className={styles.sideCard}>
              <h2 className={styles.sideTitle}>포스트 정보</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>제목</label>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setIsDirty(true);
                  }}
                  className={styles.textInput}
                  placeholder="포스트 제목을 입력하세요"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>내용</label>
                <textarea
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setIsDirty(true);
                  }}
                  className={styles.textArea}
                  placeholder="포스트 본문 내용을 입력하세요"
                />
              </div>
            </section>

            <section className={styles.sideCard}>
              <h3 className={styles.sideSubTitle}>선택 현황</h3>
              <div className={styles.statLine}>선택된 작품: {selectedImageIds.length}개</div>
              <div className={styles.statLine}>내 업로드 이미지: {images.length}개</div>
            </section>
          </aside>

          <section className={styles.contentPanel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>작품 관리</h2>
              <div className={styles.tabRow}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "selected" ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab("selected")}
                >
                  현재 작품 ({selectedImageIds.length})
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "library" ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab("library")}
                >
                  작품 추가
                </button>
              </div>
            </div>

            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
              >
                <UploadIcon />
                {uploading ? "업로드 중..." : "PC에서 업로드"}
              </button>
              <button
                type="button"
                className={styles.toolbarButtonSecondary}
                onClick={() => void loadMyImages()}
                disabled={loadingImages}
              >
                <ReloadIcon />
                새로고침
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void handleUploadFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />

              <span className={styles.toolbarHint}>작품 카드를 클릭하면 상세 편집 모달이 열립니다.</span>
            </div>

            {libraryError ? <p className={styles.errorText}>{libraryError}</p> : null}
            {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

            <div className={styles.gridWrap}>
              <PostWritePhotoGrid
                activeTab={activeTab}
                loadingImages={loadingImages}
                images={images}
                selectedImages={selectedImages}
                selectedImageIds={selectedImageIds}
                onOpenEditor={openEditor}
                onToggleSelect={toggleSelect}
              />
            </div>
          </section>
        </div>
      </main>

      <HomeFooter />

      <PostWriteEditModal
        editingImage={editingImage}
        editingDraft={editingDraft}
        selectedImageIds={selectedImageIds}
        onClose={() => setEditingImageId(null)}
        onToggleSelect={toggleSelect}
        onUpdateDraftField={updateDraftField}
      />
    </div>
  );
}
