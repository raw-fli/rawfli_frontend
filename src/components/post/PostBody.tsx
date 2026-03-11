"use client";

import ReactMarkdown from "react-markdown";
import { PostResponseDto } from "@rawfli/types";
import styles from "../article/ArticleBody.module.css";

type PostBodyProps = {
  post: PostResponseDto;
};

export default function PostBody({ post }: PostBodyProps) {
  return (
    <div className={styles.articleBody}>
      <div className={styles.content}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ margin: "0 0 1em" }}>{children}</p>,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
