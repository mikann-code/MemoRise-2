"use client";

import { type FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import {
  Button,
  FloatingInput,
  FormError,
  LoadingSpinner,
} from "@/components/common/ui";
import { useAdminWordbookQuery } from "@/graphql/queries/adminWordbook";
import { useUpdateAdminWordbookMutation } from "@/graphql/mutations/updateAdminWordbook";
import { useDeleteAdminWordbookMutation } from "@/graphql/mutations/deleteAdminWordbook";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { useFieldErrors } from "@/lib/forms/fieldErrors";
import { WORDBOOK_LABELS } from "@/constants/wordbookLabels";
import { WORDBOOK_LEVELS } from "@/constants/wordbookLevels";
import AdminPageHeader from "../../../_components/AdminPageHeader";

/**
 * 公式単語帳の編集（教材・章とも）。並び順（orderIndex）は章追加時に BE が自動採番し、
 * progress（章の解放順）と直結するため、ここでは編集しない（表示番号は並び位置から導出）。
 * 教材の label / level を変更すると、バックエンドで章へ伝播する。削除は論理削除。
 */

type Props = { params: Promise<{ id: string }> };

export default function EditAdminWordbookPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { confirm, notify } = useSnackbar();

  const { data, loading } = useAdminWordbookQuery({
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const wordbook = data?.adminWordbook ?? null;
  const isChapter = wordbook?.parentId != null;
  const backHref = isChapter
    ? `/admin/wordbooks/${wordbook?.parentId}`
    : `/admin/wordbooks/${id}`;

  const [updateAdminWordbook, { loading: saving }] = useUpdateAdminWordbookMutation();
  const [deleteAdminWordbook] = useDeleteAdminWordbookMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState("");
  const { setErrors, fieldError, systemError } = useFieldErrors([
    "title",
    "description",
    "label",
    "level",
  ]);
  const [initialized, setInitialized] = useState(false);

  if (wordbook && !initialized) {
    setInitialized(true);
    setTitle(wordbook.title);
    setDescription(wordbook.description ?? "");
    setLabel(wordbook.label ?? "");
    setLevel(wordbook.level ?? "");
  }

  if (loading && !data) {
    return (
      <Box sx={{ position: "relative", minHeight: 200 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (!wordbook) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <AdminPageHeader title="編集" backHref="/admin/wordbooks" backLabel="公式単語帳の管理" />
        <Typography sx={{ color: "var(--color-font-secondary)" }}>
          公式単語帳が見つかりませんでした。
        </Typography>
      </Container>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!title.trim()) {
      setErrors([{ field: "title", message: "タイトルを入力してください" }]);
      return;
    }

    try {
      const { data: result } = await updateAdminWordbook({
        variables: {
          id,
          title,
          description,
          label: label || null,
          level: level || null,
        },
      });
      const payload = result?.updateAdminWordbook;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "更新に失敗しました" }],
        );
        return;
      }
      notify("更新しました");
      router.push(backHref);
    } catch {
      setErrors([{ field: "system", message: "更新に失敗しました" }]);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm(
      isChapter
        ? "この章を削除しますか？"
        : "この教材を削除しますか？\n一覧から表示されなくなります。",
    );
    if (!ok) return;

    try {
      const { data: result } = await deleteAdminWordbook({ variables: { id } });
      if (!result?.deleteAdminWordbook?.success) {
        setErrors([{ field: "system", message: "削除に失敗しました" }]);
        return;
      }
      notify("削除しました");
      router.push(isChapter ? `/admin/wordbooks/${wordbook.parentId}` : "/admin/wordbooks");
    } catch {
      setErrors([{ field: "system", message: "削除に失敗しました" }]);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader
        title={isChapter ? "章を編集" : "教材を編集"}
        backHref={backHref}
        backLabel="戻る"
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FloatingInput
          id="title"
          label={isChapter ? "章タイトル" : "教材タイトル"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          labelIcon={<MenuBookOutlinedIcon />}
          error={fieldError("title")}
        />

        <FloatingInput
          id="description"
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          labelIcon={<NotesIcon />}
          error={fieldError("description")}
        />

        <TextField
          select
          fullWidth
          label="ラベル（任意）"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={saving}
          error={Boolean(fieldError("label"))}
          helperText={
            fieldError("label") ??
            (!isChapter ? "変更すると章にも反映されます" : undefined)
          }
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
          disabled={saving}
          error={Boolean(fieldError("level"))}
          helperText={
            fieldError("level") ??
            (!isChapter ? "変更すると章にも反映されます" : undefined)
          }
          sx={{ mb: 2 }}
        >
          <MenuItem value="">（未設定）</MenuItem>
          {WORDBOOK_LEVELS.map((l) => (
            <MenuItem key={l.value} value={l.value}>
              {l.label}
            </MenuItem>
          ))}
        </TextField>

        <FormError message={systemError} />

        <Box sx={{ display: "flex", gap: "10px" }}>
          <Box sx={{ flex: 1 }}>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              color="#ef4444"
              hoverColor="#dc2626"
            >
              削除
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
