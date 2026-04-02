import { Suspense } from "react";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import ArticleWriteContent from "./ArticleWriteContent";
import styles from "./page.module.css";

export default function ArticleWritePage() {
  return (
    <div className={styles.page}>
      <HomeHeader />

      <Suspense fallback={<div className={styles.main} />}>
        <ArticleWriteContent />
      </Suspense>

      <HomeFooter />
    </div>
  );
}
