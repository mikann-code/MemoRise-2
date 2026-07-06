"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import { Button, FloatingInput } from "@/components/common/ui";
import { useCreateAdminWordbookMutation } from "@/graphql/mutations/createAdminWordbook";
import { WORDBOOK_LABELS } from "@/constants/wordbookLabels";
import { WORDBOOK_LEVELS } from "@/constants/wordbookLevels";
import AdminPageHeader from "../../_components/AdminPageHeader";

/**
 * 公式単語帳（教材）の新規作成。タイトル / 説明 / ラベル / レベルを入力する。
 * ラベルはバックエンド Wordbook::LABELS に一致する選択式（値検証は BE）。
 */

type FieldError = { field: string; message: string };

export default function NewAdminWordbookPage() {
  const router = useRouter();
  const [createAdminWordbook, { loading }] = useCreateAdminWordbookMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState("");
  const [errors, setErrors] = useState<FieldError[]>([]);

  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const systemError = errors.find(
    (e) => !["title", "description", "label", "level"].includes(e.field),
  )?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!title.trim()) {
      setErrors([{ field: "title", message: "タイトルを入力してください" }]);
      return;
    }

    try {
      const { data } = await createAdminWordbook({
        variables: {
          title,
          description,
          label: label || null,
          level: level || null,
        },
      });
      const payload = data?.createAdminWordbook;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "作成に失敗しました" }],
        );
        return;
      }
      router.push("/admin/wordbooks");
    } catch {
      setErrors([{ field: "system", message: "作成に失敗しました" }]);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader
        title="教材を作成"
        backHref="/admin/wordbooks"
        backLabel="公式単語帳の管理"
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FloatingInput
          id="title"
          label="教材タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          labelIcon={<MenuBookOutlinedIcon />}
          error={fieldError("title")}
        />

        <FloatingInput
          id="description"
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          labelIcon={<NotesIcon />}
          error={fieldError("description")}
        />

        <TextField
          select
          fullWidth
          label="ラベル（任意）"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={loading}
          error={Boolean(fieldError("label"))}
          helperText={fieldError("label")}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">（未設定）</MenuItem>
          {WORDBOOK_LABELS.map((l) => (
            <MenuItem key={l.value} value={l.value}>
              {l.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          label="レベル（任意）"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={loading}
          error={Boolean(fieldError("level"))}
          helperText={fieldError("level")}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">（未設定）</MenuItem>
          {WORDBOOK_LEVELS.map((l) => (
            <MenuItem key={l.value} value={l.value}>
              {l.label}
            </MenuItem>
          ))}
        </TextField>

        {systemError && (
          <Typography sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}>
            {systemError}
          </Typography>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "作成中..." : "作成"}
        </Button>
      </Box>
    </Container>
  );
}
