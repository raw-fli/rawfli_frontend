export interface UserResponse {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  email: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = string;

export interface Board {
  id: number;
  type: string;
  name: string;
  description: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  content?: string;
  thumbnailKey?: string;
  author: UserResponse;
  views: number;
  likesCount?: number;
  commentCount: number;
  createdAt: string;
}

export interface ArticleListResponse {
  articles: ArticleListItem[];
  total: number;
}

export interface ArticleCreateRequest {
  title: string;
  content: string;
  referencedPhotoIds?: string[];
  imageIds?: string[];
}

export interface ReferencedPhoto {
  id: string;
  description?: string;
  imageKey: string;
}

export interface AttachedImage {
  id: string;
  key: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  author: UserResponse;
  replies: CommentResponse[];
  createdAt: string;
}

export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  author: UserResponse;
  views: number;
  likesCount: number;
  comments: CommentResponse[];
  referencedPhotos: ReferencedPhoto[];
  attachedImages: AttachedImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListItem {
  id: number;
  title: string;
  author: UserResponse;
  views: number;
  commentCount: number;
  createdAt: string;
}

export interface PostListResponse {
  posts: PostListItem[];
  total: number;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  imageIds?: string[];
  photoDescriptions?: string[];
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  author: UserResponse;
  views: number;
  likesCount: number;
  comments: CommentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  content: string;
  parentId?: number;
}

export interface LikeResponse {
  liked: boolean;
}

export interface ImageUploadResponse {
  id: string;
  key: string;
  url?: string;
  userId: number;
  createdAt: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}
