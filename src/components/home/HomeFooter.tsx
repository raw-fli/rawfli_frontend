import Link from "next/link";
import { CameraIcon } from "@radix-ui/react-icons";
import styles from "./HomePage.module.css";

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div>
            <div className={styles.logo}>
              <div className={styles.logoMark}>
                <CameraIcon />
              </div>
              <span className={styles.logoTitle}>Rawfli</span>
            </div>
            <p className={styles.featureText}>
              사진가들을 위한 커뮤니티 공간입니다. 당신의 렌즈로 담은 세상을 공유하세요.
            </p>
          </div>
          <div className={styles.footerMenu}>
            <div>
              <div className={styles.footerTitle}>메뉴</div>
              <div>
                <Link href="#" className={styles.footerLink}>
                  커뮤니티
                </Link>
              </div>
              <div>
                <Link href="#" className={styles.footerLink}>
                  갤러리
                </Link>
              </div>
              <div>
                <Link href="#" className={styles.footerLink}>
                  장비
                </Link>
              </div>
            </div>
            <div>
              <div className={styles.footerTitle}>지원</div>
              <div>
                <Link href="#" className={styles.footerLink}>
                  고객센터
                </Link>
              </div>
              <div>
                <Link href="#" className={styles.footerLink}>
                  공지사항
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 Rawfli. All rights reserved.</span>
          <div className={styles.footerSocial}>
            <Link href="#" className={styles.footerLink}>
              Share
            </Link>
            <Link href="#" className={styles.footerLink}>
              Global
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
