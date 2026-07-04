"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { FormLayout } from "@/components/layout";
import { SectionTitle, Button, FloatingInput } from "@/components/common/ui";
import { useCreateWordbookMutation } from "@/graphql/mutations/createWordbook";

/**
 * 自作単語帳の作成（v1 の /wordbooks/new を忠実に再現）。
 * タイトル / 説明（任意）/ ラベル（自由入力）の 3 項目。
 * タイトル必須はクライアントで先に検証し、サーバーの {success, errors} は field 単位で表示する。
 */

type FieldError = { field: string; message: string };

export default function NewWordbookPage() {
  const router = useRouter();
  const [createWordbook, { loading }] = useCreateWordbookMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  // サーバーの errors 配列をそのまま持ち、表示時に field 名で引く。
  const [errors, setErrors] = useState<FieldError[]>([]);
  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  // 3 つの入力欄に紐付かないエラー（認証失敗の "system" など）はフォーム下にまとめて出す。
  const systemError = errors.find(
    (e) => !["title", "description", "label"].includes(e.field),
  )?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!title.trim()) {
      setErrors([{ field: "title", message: "タイトルを入力してください" }]);
      return;
    }

    try {
      const { data } = await createWordbook({
        variables: { title, description, label },
      });
      const payload = data?.createWordbook;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "作成に失敗しました" }],
        );
        return;
      }
      router.push("/wordbooks");
    } catch {
      setErrors([{ field: "system", message: "作成に失敗しました" }]);
    }
  };

  return (
    <FormLayout
      header={
        <SectionTitle
          icon={<ClassOutlinedIcon />}
          subTitle="Create New Wordbook"
          title="単語帳を作成"
        />
      }
      description={<Typography>単語帳の基本情報を入力してください。</Typography>}
      form={
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FloatingInput
            id="title"
            label="単語帳タイトル"
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

          <FloatingInput
            id="label"
            label="ラベル（例: 英語 / IT / TOEIC）"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={loading}
            labelIcon={<LocalOfferOutlinedIcon />}
            error={fieldError("label")}
          />

          {systemError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}>
              {systemError}
            </Typography>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "作成中..." : "作成"}
          </Button>
        </Box>
      }
    />
  );
}
