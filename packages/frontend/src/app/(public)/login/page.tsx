"use client";

import { type FormEvent, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { FormLayout } from "@/components/layout";
import { Button, FloatingInput } from "@/components/common/ui";
import { useAuth } from "@/lib/auth/useAuth";
import { authErrorMessage } from "@/lib/auth/authError";

/** ログイン画面（(public) グループ。FormLayout を新規登録画面と共用）。 */
export default function LoginPage() {
  const { login, loginError, submitting } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <FormLayout
      header={
        <Typography variant="h4" component="h1" fontWeight={700}>
          ログイン
        </Typography>
      }
      description="メールアドレスとパスワードでログインします。"
      form={
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FloatingInput
            id="email"
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            labelIcon={<MailOutlineIcon />}
          />
          <FloatingInput
            id="password"
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            labelIcon={<LockOutlinedIcon />}
          />
          {loginError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mt: -1.5, mb: 2 }}>
              {authErrorMessage(loginError, "ログインに失敗しました")}
            </Typography>
          )}
          <Box sx={{ mt: 4 }}>
            <Button type="submit" disabled={submitting || !email || !password}>
              {submitting ? "ログイン中..." : "ログイン"}
            </Button>
          </Box>
          <Typography sx={{ mt: 3, textAlign: "center", fontSize: 14 }}>
            アカウントをお持ちでない方は{" "}
            <Box
              component={NextLink}
              href="/signup"
              sx={{
                color: "var(--color-primary)",
                fontWeight: 500,
                borderBottom: "1px solid var(--color-primary)",
                transition: "color .15s ease, border-color .15s ease",
                "&:hover": {
                  color: "var(--color-secondary)",
                  borderBottomColor: "var(--color-secondary)",
                },
              }}
            >
              新規登録
            </Box>
          </Typography>
        </Box>
      }
    />
  );
}
