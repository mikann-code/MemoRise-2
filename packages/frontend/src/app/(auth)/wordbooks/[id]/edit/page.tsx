"use client";

import { type FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { FormLayout } from "@/components/layout";
import {
  SectionTitle,
  Button,
  FloatingInput,
  LoadingSpinner,
} from "@/components/common/ui";
import { useMyWordbookQuery } from "@/graphql/queries/myWordbook";
import { useUpdateWordbookMutation } from "@/graphql/mutations/updateWordbook";
import { useDeleteWordbookMutation } from "@/graphql/mutations/deleteWordbook";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 自作単語帳の編集（v1 の /wordbooks/[id]/edit を忠実に再現）。
 * 作成と同じ 3 項目（プリフィル済み）＋フォーム下に赤枠ピルの削除ボタン。
 * 削除はスナックバー確認後に論理削除して一覧へ戻る。
 */

type FieldError = { field: string; message: string };

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditWordbookPage({ params }: Props) {
  const router = useRouter();
  const { id: wordbookId } = use(params);
  const { confirm, notify } = useSnackbar();

  const { data, loading } = useMyWordbookQuery({
    variables: { id: wordbookId },
    fetchPolicy: "cache-and-network",
  });
  const wordbook = data?.myWordbook ?? null;

  const [updateWordbook, { loading: updating }] = useUpdateWordbookMutation();
  const [deleteWordbook, { loading: deleting }] = useDeleteWordbookMutation();
  const isPending = updating || deleting;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  // サーバーの errors 配列をそのまま持ち、表示時に field 名で引く。
  const [errors, setErrors] = useState<FieldError[]>([]);
  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  // 3 つの入力欄に紐付かないエラー（認証失敗の "system"、対象なしの "id" など）は
  // フォーム下にまとめて出す。
  const systemError = errors.find(
    (e) => !["title", "description", "label"].includes(e.field),
  )?.message;

  // 取得済みデータでフォームを一度だけ初期化する（レンダー中の状態調整パターン）。
  // cache-and-network で 2 回データが届いても編集中の入力を上書きしない。
  const [initialized, setInitialized] = useState(false);
  if (wordbook && !initialized) {
    setInitialized(true);
    setTitle(wordbook.title);
    setDescription(wordbook.description ?? "");
    setLabel(wordbook.label ?? "");
  }

  if (loading && !data) {
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (!wordbook) {
    return (
      <Typography sx={{ color: "var(--color-font-secondary)" }}>
        単語帳が見つかりません
      </Typography>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!title.trim()) {
      setErrors([{ field: "title", message: "タイトルを入力してください" }]);
      return;
    }

    try {
      const { data: result } = await updateWordbook({
        variables: { id: wordbookId, title: title.trim(), description, label },
      });
      const payload = result?.updateWordbook;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "更新に失敗しました" }],
        );
        return;
      }
      notify("更新しました");
      router.push(`/wordbooks/${wordbookId}/list`);
    } catch {
      setErrors([{ field: "system", message: "更新に失敗しました" }]);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm(
      "この単語帳を削除しますか？\n中の単語もすべて削除されます。",
    );
    if (!ok) return;

    try {
      const { data: result } = await deleteWordbook({
        variables: { id: wordbookId },
      });
      if (!result?.deleteWordbook?.success) {
        setErrors([{ field: "system", message: "削除に失敗しました" }]);
        return;
      }
      router.push("/wordbooks");
    } catch {
      setErrors([{ field: "system", message: "削除に失敗しました" }]);
    }
  };

  return (
    <>
      <FormLayout
        header={
          <SectionTitle
            icon={<EditOutlinedIcon />}
            subTitle="wordbook"
            title="単語帳を編集"
          />
        }
        description="タイトル・説明・ラベルを変更できます"
        form={
          <Box component="form" onSubmit={onSubmit} noValidate>
            <FloatingInput
              id="title"
              label="単語帳タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              labelIcon={<MenuBookOutlinedIcon />}
              error={fieldError("title")}
            />

            <FloatingInput
              id="description"
              label="説明（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              labelIcon={<NotesIcon />}
              error={fieldError("description")}
            />

            <FloatingInput
              id="label"
              label="ラベル（例: 英語 / IT / TOEIC）"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isPending}
              labelIcon={<LocalOfferOutlinedIcon />}
              error={fieldError("label")}
            />

            {systemError && (
              <Typography
                sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}
              >
                {systemError}
              </Typography>
            )}

            <Button type="submit" disabled={isPending}>
              {updating ? "更新中..." : "保存"}
            </Button>
          </Box>
        }
      />

      {/* v1 の .deleteWordbookButton（赤枠ピル・右寄せ）を sx で再現。幅はフォームと同じ全幅。 */}
      <Box sx={{ width: "100%" }}>
        <Box
          component="button"
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          sx={{
            background: "transparent",
            border: "1px solid rgba(255,107,107,.4)",
            color: "rgba(255,107,107,.7)",
            p: "4px 10px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            transition: "all .2s ease",
            mt: "10px",
            ml: "auto",
            "&:hover": {
              background: "rgba(255,107,107,.15)",
              color: "#ff6b6b",
            },
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          この単語帳を削除
        </Box>
      </Box>
    </>
  );
}
