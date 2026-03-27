import { CameraIcon, Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { MyImageItemResponseDto } from "@rawfli/types";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "@/app/posts/write/page.module.css";
import { PhotoDraft } from "./post-write.types";

type PostWriteEditModalProps = {
  editingImage?: MyImageItemResponseDto;
  editingDraft?: PhotoDraft;
  selectedImageIds: string[];
  onClose: () => void;
  onToggleSelect: (image: MyImageItemResponseDto) => void;
  onUpdateDraftField: (imageId: string, field: keyof PhotoDraft, value: string) => void;
};

export default function PostWriteEditModal({
  editingImage,
  editingDraft,
  selectedImageIds,
  onClose,
  onToggleSelect,
  onUpdateDraftField,
}: PostWriteEditModalProps) {
  if (!editingImage || !editingDraft) {
    return null;
  }

  const isAttached = selectedImageIds.includes(editingImage.id);
  const previewUrl = toS3ImageUrl(editingImage.key);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalRoot} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
        >
          <Cross2Icon />
        </button>

        <div className={styles.modalPreview}>
          {previewUrl ? (
            <img
              src={previewUrl}
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
            className={`${styles.attachButton} ${isAttached ? styles.attachButtonActive : ""}`}
            onClick={() => onToggleSelect(editingImage)}
          >
            {isAttached ? "포스트에 포함됨" : "포스트에 추가"}
          </button>

          <div className={styles.modalFieldGrid}>
            <label className={styles.modalFieldLabel}>작품 설명</label>
            <textarea
              className={styles.modalTextArea}
              value={editingDraft.description}
              onChange={(event) => onUpdateDraftField(editingImage.id, "description", event.target.value)}
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
                  onChange={(event) => onUpdateDraftField(editingImage.id, "cameraModel", event.target.value)}
                  placeholder="모델명"
                />
              </div>
              <input
                className={styles.modalInput}
                value={editingDraft.cameraBrand}
                onChange={(event) => onUpdateDraftField(editingImage.id, "cameraBrand", event.target.value)}
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
                  onChange={(event) => onUpdateDraftField(editingImage.id, "lensModel", event.target.value)}
                  placeholder="모델명"
                />
              </div>
              <input
                className={styles.modalInput}
                value={editingDraft.lensBrand}
                onChange={(event) => onUpdateDraftField(editingImage.id, "lensBrand", event.target.value)}
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
                onChange={(event) => onUpdateDraftField(editingImage.id, "iso", event.target.value)}
                placeholder="3200"
              />
            </div>
            <div className={styles.modalFieldGrid}>
              <label className={styles.modalFieldLabel}>Shutter</label>
              <input
                className={styles.modalInput}
                value={editingDraft.shutterSpeed}
                onChange={(event) => onUpdateDraftField(editingImage.id, "shutterSpeed", event.target.value)}
                placeholder="1/125"
              />
            </div>
            <div className={styles.modalFieldGrid}>
              <label className={styles.modalFieldLabel}>Aperture</label>
              <input
                className={styles.modalInput}
                value={editingDraft.aperture}
                onChange={(event) => onUpdateDraftField(editingImage.id, "aperture", event.target.value)}
                placeholder="2.8"
              />
            </div>
            <div className={styles.modalFieldGrid}>
              <label className={styles.modalFieldLabel}>Focal Length</label>
              <input
                className={styles.modalInput}
                value={editingDraft.focalLength}
                onChange={(event) => onUpdateDraftField(editingImage.id, "focalLength", event.target.value)}
                placeholder="24"
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalSecondaryButton}
              onClick={onClose}
            >
              닫기
            </button>
            <button
              type="button"
              className={styles.modalPrimaryButton}
              onClick={onClose}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
