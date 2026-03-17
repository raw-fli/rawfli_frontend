"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminControllerCreateAdmin, useAdminControllerLogin } from "@/lib/admin-api";
import { isAdminLoggedIn, saveAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage } from "@/lib/api";
import styles from "./admin-auth.module.css";

type Mode = "login" | "signup";

export default function AdminAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loginMutation = useAdminControllerLogin();
  const createAdminMutation = useAdminControllerCreateAdmin();

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const isPending = useMemo(
    () => loginMutation.isPending || createAdminMutation.isPending,
    [loginMutation.isPending, createAdminMutation.isPending],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "login") {
        const result = await loginMutation.mutateAsync({
          data: { username: username.trim(), password },
        });
        saveAdminToken(result.data.token);
        router.push("/admin/dashboard");
        return;
      }

      await createAdminMutation.mutateAsync({
        data: { username: username.trim(), password },
      });
      setMode("login");
      setSuccessMessage("관리자 생성이 완료되었습니다. 로그인해 주세요.");
      setPassword("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Rawfli Admin</h1>
        <p className={styles.subtitle}>
          {mode === "login" ? "관리자 계정으로 로그인" : "첫 관리자 계정 생성"}
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={mode === "signup" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />

          {errorMessage && <p className={styles.message}>{errorMessage}</p>}
          {successMessage && <p className={styles.success}>{successMessage}</p>}

          <button className={styles.submitButton} type="submit" disabled={isPending}>
            {isPending ? "처리 중..." : mode === "login" ? "로그인" : "관리자 생성"}
          </button>
        </form>

        <button
          type="button"
          className={styles.switchButton}
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setMode((prev) => (prev === "login" ? "signup" : "login"));
          }}
          disabled={isPending}
        >
          {mode === "login" ? "첫 관리자 생성하기" : "로그인으로 돌아가기"}
        </button>
      </section>
    </main>
  );
}
