"use client";

import { type FormEvent, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { FormLayout } from "@/components/layout";
import { Button, FloatingInput } from "@/components/common/ui";
import { useAdminAuth } from "@/lib/auth/useAdminAuth";
import { authErrorMessage } from "@/lib/auth/authError";

/**
 * 管理者ログイン画面（(admin-user) グループ。一般ログインとは画面空間・キャッシュを分離）。
 * 管理者はシステム側で発行する前提のため新規登録導線は持たない。
 */
export default function AdminLoginPage() {
  const { adminLogin, adminLoginError, submitting } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await adminLogin({ email, password });
  };

  return (
    <FormLayout
      header={
        <Typography variant="h4" component="h1" fontWeight={700}>
          管理者ログイン
        </Typography>
      }
      description="管理者のメールアドレスとパスワードでログインします。"
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
          {adminLoginError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mt: -1.5, mb: 2 }}>
              {authErrorMessage(adminLoginError, "ログインに失敗しました")}
            </Typography>
          )}
          <Box sx={{ mt: 4 }}>
            <Button type="submit" disabled={submitting || !email || !password}>
              {submitting ? "ログイン中..." : "ログイン"}
            </Button>
          </Box>
        </Box>
      }
    />
  );
}
