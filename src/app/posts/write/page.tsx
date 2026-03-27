"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  CheckIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
  Pencil2Icon,
  PlusIcon,
  ReloadIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
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
import { getApiErrorMessage } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./page.module.css";

type WriteTab = "selected" | "library";

type PhotoDraft = {
  description: string;
  cameraBrand: string;
  cameraModel: string;
  lensBrand: string;
  lensModel: string;
  iso: string;
  shutterSpeed: string;
  aperture: string;
  focalLength: string;
};

const LEAVE_WARNING_MESSAGE = "임시저장이 없어 작성 중인 내용이 사라질 수 있습니다. 페이지를 나가시겠습니까?";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumericString(value?: number | null): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function createDraft(image: MyImageItemResponseDto): PhotoDraft {
  return {
    description: "",
    cameraBrand: image.cameraMake ?? "",
    cameraModel: image.cameraModel ?? "",
    lensBrand: image.lensMake ?? "",
    lensModel: image.lensModel ?? "",
    iso: toNumericString(image.iso),
    shutterSpeed: image.shutterSpeedDisplay ?? "",
    aperture: toNumericString(image.aperture),
    focalLength: toNumericString(image.focalLength),
  };
}

function extractMyImages(payload: unknown): MyImageItemResponseDto[] {
  if (!isRecord(payload)) return [];
  const maybeData = payload.data;
  if (!isRecord(maybeData)) return [];
  const maybeImages = maybeData.images;
  if (!Array.isArray(maybeImages)) return [];
  return maybeImages.filter(
    (item): item is MyImageItemResponseDto =>
      isRecord(item) && typeof item.id === "string" && typeof item.key === "string",
  );
}

function extractUploadedImageIds(payload: unknown): string[] {
  const ids: string[] = [];

  const collectFromArray = (arr: unknown[]) => {
    for (const item of arr) {
      if (!isRecord(item)) continue;
      if (typeof item.id === "string") ids.push(item.id);
    }
  };

  if (Array.isArray(payload)) {
    collectFromArray(payload);
    return ids;
  }

  if (!isRecord(payload)) {
    return ids;
  }

  const maybeData = payload.data;
  if (Array.isArray(maybeData)) {
    collectFromArray(maybeData);
    return ids;
  }

  if (isRecord(maybeData) && Array.isArray(maybeData.data)) {
    collectFromArray(maybeData.data);
  }

  return ids;
}

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
      const current = prev[imageId] ?? createDraft(imageById.get(imageId) as MyImageItemResponseDto);
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
              {loadingImages ? (
                <div className={styles.emptyState}>작품 목록을 불러오는 중입니다...</div>
              ) : activeTab === "selected" ? (
                selectedImages.length > 0 ? (
                  <div className={styles.photoGrid}>
                    {selectedImages.map((image) => {
                      const imageUrl = toS3ImageUrl(image.key);
                      const isSelected = selectedImageIds.includes(image.id);

                      return (
                        <div
                          key={image.id}
                          className={styles.photoCard}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditor(image)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openEditor(image);
                            }
                          }}
                        >
                          {imageUrl ? (
                            <img src={imageUrl} alt={image.key} className={styles.photoImage} />
                          ) : (
                            <div className={styles.photoEmpty}>No Image</div>
                          )}

                          <span className={styles.photoMeta}>ID {image.id.slice(0, 8)}</span>

                          <button
                            type="button"
                            className={`${styles.selectMark} ${isSelected ? styles.selectMarkActive : ""}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelect(image);
                            }}
                            aria-label="선택 토글"
                          >
                            {isSelected ? <CheckIcon /> : <PlusIcon />}
                          </button>

                          <span className={styles.editMark}>
                            <Pencil2Icon />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>선택된 작품이 없습니다. 작품 추가 탭에서 작품을 선택하세요.</div>
                )
              ) : images.length > 0 ? (
                <div className={styles.photoGrid}>
                  {images.map((image) => {
                    const imageUrl = toS3ImageUrl(image.key);
                    const isSelected = selectedImageIds.includes(image.id);

                    return (
                      <div
                        key={image.id}
                        className={styles.photoCard}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditor(image)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openEditor(image);
                          }
                        }}
                      >
                        {imageUrl ? (
                          <img src={imageUrl} alt={image.key} className={styles.photoImage} />
                        ) : (
                          <div className={styles.photoEmpty}>No Image</div>
                        )}

                        <span className={styles.photoMeta}>{image.usedInPhotoCount > 0 ? `사용 ${image.usedInPhotoCount}회` : "미사용"}</span>

                        <button
                          type="button"
                          className={`${styles.selectMark} ${isSelected ? styles.selectMarkActive : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSelect(image);
                          }}
                          aria-label="선택 토글"
                        >
                          {isSelected ? <CheckIcon /> : <PlusIcon />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>업로드된 이미지가 없습니다. 먼저 이미지를 업로드해 주세요.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <HomeFooter />

      {editingImage && editingDraft && (
        <div className={styles.modalOverlay} onClick={() => setEditingImageId(null)}>
          <div className={styles.modalRoot} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setEditingImageId(null)}
            >
              <Cross2Icon />
            </button>

            <div className={styles.modalPreview}>
              {toS3ImageUrl(editingImage.key) ? (
                <img
                  src={toS3ImageUrl(editingImage.key)}
                  alt={editingImage.key}
                  className={styles.modalPreviewImage}
                />
              ) : (
                <div className={styles.modalPreviewEmpty}>이미지 미리보기가 없습니다.</div>
              )}
            </div>

            <div className={styles.modalForm}>
              <div className={styles.modalHead}>
                <span className={styles.modalHeadLabel}>메타데이터 편집</span>
                <h3 className={styles.modalTitle}>작품 상세 정보</h3>
              </div>

              <button
                type="button"
                className={`${styles.attachButton} ${selectedImageIds.includes(editingImage.id) ? styles.attachButtonActive : ""}`}
                onClick={() => toggleSelect(editingImage)}
              >
                {selectedImageIds.includes(editingImage.id) ? "포스트에 포함됨" : "포스트에 추가"}
              </button>

              <div className={styles.modalFieldGrid}>
                <label className={styles.modalFieldLabel}>작품 설명</label>
                <textarea
                  className={styles.modalTextArea}
                  value={editingDraft.description}
                  onChange={(event) => updateDraftField(editingImage.id, "description", event.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.metaGridTwo}>
                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>Camera Body</label>
                  <div className={styles.inputWithIcon}>
                    <CameraIcon className={styles.inputIcon} />
                    <input
                      className={styles.modalInput}
                      value={editingDraft.cameraModel}
                      onChange={(event) => updateDraftField(editingImage.id, "cameraModel", event.target.value)}
                      placeholder="모델명"
                    />
                  </div>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.cameraBrand}
                    onChange={(event) => updateDraftField(editingImage.id, "cameraBrand", event.target.value)}
                    placeholder="브랜드"
                  />
                </div>

                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>Lens Model</label>
                  <div className={styles.inputWithIcon}>
                    <MagnifyingGlassIcon className={styles.inputIcon} />
                    <input
                      className={styles.modalInput}
                      value={editingDraft.lensModel}
                      onChange={(event) => updateDraftField(editingImage.id, "lensModel", event.target.value)}
                      placeholder="모델명"
                    />
                  </div>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.lensBrand}
                    onChange={(event) => updateDraftField(editingImage.id, "lensBrand", event.target.value)}
                    placeholder="브랜드"
                  />
                </div>
              </div>

              <div className={styles.metaGridFour}>
                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>ISO</label>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.iso}
                    onChange={(event) => updateDraftField(editingImage.id, "iso", event.target.value)}
                    placeholder="3200"
                  />
                </div>
                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>Shutter</label>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.shutterSpeed}
                    onChange={(event) => updateDraftField(editingImage.id, "shutterSpeed", event.target.value)}
                    placeholder="1/125"
                  />
                </div>
                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>Aperture</label>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.aperture}
                    onChange={(event) => updateDraftField(editingImage.id, "aperture", event.target.value)}
                    placeholder="2.8"
                  />
                </div>
                <div className={styles.modalFieldGrid}>
                  <label className={styles.modalFieldLabel}>Focal Length</label>
                  <input
                    className={styles.modalInput}
                    value={editingDraft.focalLength}
                    onChange={(event) => updateDraftField(editingImage.id, "focalLength", event.target.value)}
                    placeholder="24"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => setEditingImageId(null)}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className={styles.modalPrimaryButton}
                  onClick={() => setEditingImageId(null)}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
