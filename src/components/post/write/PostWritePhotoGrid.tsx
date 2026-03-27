import { CheckIcon, Pencil2Icon, PlusIcon } from "@radix-ui/react-icons";
import { MyImageItemResponseDto } from "@rawfli/types";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "@/app/posts/write/page.module.css";
import { WriteTab } from "./post-write.types";

type PostWritePhotoGridProps = {
  activeTab: WriteTab;
  loadingImages: boolean;
  images: MyImageItemResponseDto[];
  selectedImages: MyImageItemResponseDto[];
  selectedImageIds: string[];
  onOpenEditor: (image: MyImageItemResponseDto) => void;
  onToggleSelect: (image: MyImageItemResponseDto) => void;
};

type PhotoCardProps = {
  image: MyImageItemResponseDto;
  isSelected: boolean;
  metaText: string;
  showEditMark: boolean;
  onOpenEditor: (image: MyImageItemResponseDto) => void;
  onToggleSelect: (image: MyImageItemResponseDto) => void;
};

function PhotoCard({
  image,
  isSelected,
  metaText,
  showEditMark,
  onOpenEditor,
  onToggleSelect,
}: PhotoCardProps) {
  const imageUrl = toS3ImageUrl(image.key);

  return (
    <div
      className={styles.photoCard}
      role="button"
      tabIndex={0}
      onClick={() => onOpenEditor(image)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenEditor(image);
        }
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={image.key} className={styles.photoImage} />
      ) : (
        <div className={styles.photoEmpty}>No Image</div>
      )}

      <span className={styles.photoMeta}>{metaText}</span>

      <button
        type="button"
        className={`${styles.selectMark} ${isSelected ? styles.selectMarkActive : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleSelect(image);
        }}
        aria-label="선택 토글"
      >
        {isSelected ? <CheckIcon /> : <PlusIcon />}
      </button>

      {showEditMark ? (
        <span className={styles.editMark}>
          <Pencil2Icon />
        </span>
      ) : null}
    </div>
  );
}

export default function PostWritePhotoGrid({
  activeTab,
  loadingImages,
  images,
  selectedImages,
  selectedImageIds,
  onOpenEditor,
  onToggleSelect,
}: PostWritePhotoGridProps) {
  if (loadingImages) {
    return <div className={styles.emptyState}>작품 목록을 불러오는 중입니다...</div>;
  }

  if (activeTab === "selected") {
    if (selectedImages.length === 0) {
      return <div className={styles.emptyState}>선택된 작품이 없습니다. 작품 추가 탭에서 작품을 선택하세요.</div>;
    }

    return (
      <div className={styles.photoGrid}>
        {selectedImages.map((image) => (
          <PhotoCard
            key={image.id}
            image={image}
            isSelected={selectedImageIds.includes(image.id)}
            metaText={`ID ${image.id.slice(0, 8)}`}
            showEditMark
            onOpenEditor={onOpenEditor}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return <div className={styles.emptyState}>업로드된 이미지가 없습니다. 먼저 이미지를 업로드해 주세요.</div>;
  }

  return (
    <div className={styles.photoGrid}>
      {images.map((image) => (
        <PhotoCard
          key={image.id}
          image={image}
          isSelected={selectedImageIds.includes(image.id)}
          metaText={image.usedInPhotoCount > 0 ? `사용 ${image.usedInPhotoCount}회` : "미사용"}
          showEditMark={false}
          onOpenEditor={onOpenEditor}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
