"use client";

import { type FormEvent, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { FormLayout } from "@/components/layout";
import { Button, FloatingInput } from "@/components/common/ui";
import { useAuth } from "@/lib/auth/useAuth";
import { authErrorMessage } from "@/lib/auth/authError";

/** 新規登録画面（(public) グループ。FormLayout をログイン画面と共用）。 */
export default function SignUpPage() {
  const { signUp, signUpError, submitting } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // 確認用パスワードは打ち間違い防止用。送信前にフロントで突き合わせるだけで、
  // サーバー（mutation）には password のみ送る。入力途中は不一致を出さない。
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) return;
    await signUp({ name, email, password });
  };

  return (
    <FormLayout
      header={
        <Typography variant="h4" component="h1" fontWeight={700}>
          新規登録
        </Typography>
      }
      description="名前・メールアドレス・パスワード（8 文字以上）を登録します。"
      form={
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FloatingInput
            id="name"
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            labelIcon={<PersonOutlineIcon />}
          />
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
          <FloatingInput
            id="passwordConfirm"
            label="パスワード（確認）"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={submitting}
            error={passwordMismatch ? "パスワードが一致しません" : undefined}
            labelIcon={<CheckCircleOutlineIcon />}
          />
          {signUpError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mt: -1.5, mb: 2 }}>
              {authErrorMessage(signUpError, "登録に失敗しました")}
            </Typography>
          )}
          <Box sx={{ mt: 4 }}>
            <Button
              type="submit"
              disabled={
                submitting ||
                !name ||
                !email ||
                !password ||
                !passwordConfirm ||
                passwordMismatch
              }
            >
              {submitting ? "登録中..." : "新規登録"}
            </Button>
          </Box>
          <Typography sx={{ mt: 3, textAlign: "center", fontSize: 14 }}>
            すでにアカウントをお持ちの方は{" "}
            <Box
              component={NextLink}
              href="/login"
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
              ログイン
            </Box>
          </Typography>
        </Box>
      }
    />
  );
}
