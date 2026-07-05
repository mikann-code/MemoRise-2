"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { FormLayout } from "@/components/layout";
import { SectionTitle, Button, FloatingInput } from "@/components/common/ui";
import { useCurrentUser } from "@/lib/auth/authContext";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { useUpdateProfileMutation } from "@/graphql/mutations/updateProfile";

/**
 * プロフィール編集（v1 の /my-page/edit を踏襲）。名前は必須、パスワードは変更するときだけ入力する。
 * 確認用パスワードは送信前にフロントで突き合わせ、サーバーには password のみ送る。
 * 更新成功後は currentUser を refetch して Header 等の表示（名前）を即時に追随させ、マイページへ戻る。
 * サーバーの {success, errors} は field 単位で表示する（errors 配列を fieldError で引く）。
 */

type FieldError = { field: string; message: string };

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, refetch } = useCurrentUser();
  const { notify } = useSnackbar();
  const [updateProfile, { loading }] = useUpdateProfileMutation();

  const [name, setName] = useState(currentUser.name);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<FieldError[]>([]);

  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  // 入力欄に紐付かないエラー（認証失敗の "system" など）はフォーム下にまとめて出す。
  const systemError = errors.find(
    (e) => !["name", "password", "passwordConfirmation"].includes(e.field),
  )?.message;

  // 確認用パスワードは打ち間違い防止用。入力途中は不一致を出さない。
  const passwordMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!name.trim()) {
      setErrors([{ field: "name", message: "名前を入力してください" }]);
      return;
    }
    if (password !== passwordConfirm) {
      setErrors([
        {
          field: "passwordConfirmation",
          message: "パスワード（確認）が一致しません",
        },
      ]);
      return;
    }

    try {
      const { data } = await updateProfile({
        variables: {
          name,
          // パスワードは変更するときだけ送る（空欄なら変更しない）。
          password: password || null,
          passwordConfirmation: passwordConfirm || null,
        },
      });
      const payload = data?.updateProfile;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((err) => ({
                field: err.field,
                message: err.message,
              }))
            : [{ field: "system", message: "更新に失敗しました" }],
        );
        return;
      }
      // 更新後の名前を Header 等へ即時反映する。
      await refetch();
      notify("プロフィールを更新しました");
      router.push("/my-page");
    } catch {
      setErrors([{ field: "system", message: "更新に失敗しました" }]);
    }
  };

  return (
    <FormLayout
      header={
        <SectionTitle
          icon={<BadgeOutlinedIcon />}
          subTitle="Edit Profile"
          title="プロフィール編集"
        />
      }
      description={
        <Typography>名前とパスワードを変更できます。</Typography>
      }
      form={
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FloatingInput
            id="name"
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            labelIcon={<PersonOutlineIcon />}
            error={fieldError("name")}
          />

          <FloatingInput
            id="password"
            label="新しいパスワード（変更する場合）"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            labelIcon={<LockOutlinedIcon />}
            error={fieldError("password")}
          />

          <FloatingInput
            id="passwordConfirm"
            label="パスワード（確認）"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={loading}
            labelIcon={<CheckCircleOutlineIcon />}
            error={
              passwordMismatch
                ? "パスワードが一致しません"
                : fieldError("passwordConfirmation")
            }
          />

          {systemError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}>
              {systemError}
            </Typography>
          )}

          <Button
            type="submit"
            disabled={loading || !name.trim() || passwordMismatch}
          >
            {loading ? "保存中..." : "保存"}
          </Button>
        </Box>
      }
    />
  );
}
