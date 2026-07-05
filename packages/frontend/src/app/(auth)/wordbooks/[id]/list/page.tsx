"use client";

import { type FormEvent, use, useEffect, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { WordbookListLayout } from "@/components/layout";
import {
  SectionTitle,
  Button,
  FloatingInput,
  LoadingSpinner,
} from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { useMyWordbookQuery } from "@/graphql/queries/myWordbook";
import { useCreateWordMutation } from "@/graphql/mutations/createWord";
import { useUpdateWordMutation } from "@/graphql/mutations/updateWord";
import { useDeleteWordMutation } from "@/graphql/mutations/deleteWord";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 自作単語帳の単語一覧（v1 の /wordbooks/[id]/list を忠実に再現）。
 * 見出し右に「編集」ピル、追加フォーム（単語 / 意味）＋「単語を登録」「今すぐはじめる」、
 * 下に答えを開いた WordCard を並べる。復習タグはバックエンド保存（user_word_tags）。
 * v1 に無い単語の編集は、カードの編集アイコン → その場でインライン編集フォームに切り替える。
 */

// サーバーの errors 配列をそのまま持ち、表示時に field 名で引く。
// 追加フォームとインライン編集フォームで errors state が 2 つあるため、引く側を関数にしておく。
type FieldError = { field: string; message: string };

const findFieldError = (errors: FieldError[], field: string) =>
  errors.find((e) => e.field === field)?.message;

// 2 つの入力欄に紐付かないエラー（認証失敗の "system"、対象なしの "id" など）は
// フォーム下にまとめて出す。
const findSystemError = (errors: FieldError[]) =>
  errors.find((e) => !["question", "answer"].includes(e.field))?.message;

type Props = {
  params: Promise<{ id: string }>;
};

export default function WordbookDetailPage({ params }: Props) {
  const { id: wordbookId } = use(params);

  const { data, loading, error, refetch } = useMyWordbookQuery({
    variables: { id: wordbookId },
    fetchPolicy: "cache-and-network",
  });
  const wordbook = data?.myWordbook ?? null;

  const [createWord, { loading: adding }] = useCreateWordMutation();
  const [updateWord, { loading: updating }] = useUpdateWordMutation();
  const [deleteWord] = useDeleteWordMutation();

  const { isTagged, toggleTag } = useReviewTags();
  const { confirm } = useSnackbar();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<FieldError[]>([]);

  // インライン編集中の単語（v1 に無い要素。編集アイコンでカードをフォームに切り替える）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editErrors, setEditErrors] = useState<FieldError[]>([]);

  const systemError = findSystemError(errors);
  const editSystemError = findSystemError(editErrors);

  // ホームの「作成する / テストする」タイルが最後に使った単語帳へ直行するためのキー（CraftWord 参照）。
  useEffect(() => {
    if (wordbookId) localStorage.setItem("lastWordbookUuid", wordbookId);
  }, [wordbookId]);

  if (loading && !data) {
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "var(--color-error)" }}>
        単語の取得に失敗しました
      </Typography>
    );
  }

  if (!wordbook) {
    return (
      <Typography sx={{ color: "var(--color-font-secondary)" }}>
        単語帳が見つかりませんでした。{" "}
        <Box
          component={NextLink}
          href="/wordbooks"
          sx={{ color: "var(--color-primary)" }}
        >
          単語帳一覧へ戻る
        </Box>
      </Typography>
    );
  }

  const words = wordbook.words;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const nextErrors: FieldError[] = [];
    if (!question.trim())
      nextErrors.push({ field: "question", message: "単語を入力してください" });
    if (!answer.trim())
      nextErrors.push({ field: "answer", message: "意味を入力してください" });
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    try {
      const { data: result } = await createWord({
        variables: { wordbookId, question, answer },
      });
      const payload = result?.createWord;
      if (!payload?.success) {
        setErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "登録に失敗しました" }],
        );
        return;
      }
      setQuestion("");
      setAnswer("");
      await refetch();
    } catch {
      setErrors([{ field: "system", message: "登録に失敗しました" }]);
    }
  };

  const startEdit = (word: { id: string; question: string; answer: string }) => {
    setEditingId(word.id);
    setEditQuestion(word.question);
    setEditAnswer(word.answer);
    setEditErrors([]);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditErrors([]);

    const nextErrors: FieldError[] = [];
    if (!editQuestion.trim())
      nextErrors.push({ field: "question", message: "単語を入力してください" });
    if (!editAnswer.trim())
      nextErrors.push({ field: "answer", message: "意味を入力してください" });
    if (nextErrors.length) {
      setEditErrors(nextErrors);
      return;
    }

    try {
      const { data: result } = await updateWord({
        variables: { id: editingId, question: editQuestion, answer: editAnswer },
      });
      const payload = result?.updateWord;
      if (!payload?.success) {
        setEditErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "更新に失敗しました" }],
        );
        return;
      }
      setEditingId(null);
      await refetch();
    } catch {
      setEditErrors([{ field: "system", message: "更新に失敗しました" }]);
    }
  };

  const handleDelete = async (wordId: string) => {
    try {
      await deleteWord({ variables: { id: wordId } });
      await refetch();
    } catch {
      // 失敗時は一覧が変わらないだけなので黙って握りつぶさず再取得だけ試みる
      await refetch();
    }
  };

  // 復習タグは付け外しの両方向とも確認する（付ける側は mutation → refetch の反映待ちで
  // 一瞬未登録に見えるため、confirm を挟んで操作の成立を明示する）。
  const handleTagToggle = async (wordId: string) => {
    const message = isTagged(wordId)
      ? "この単語を復習リストの登録から外しますか？"
      : "この単語を復習リストに登録しますか？";
    if (!(await confirm(message))) return;
    // 失敗時は表示が変わらないだけなので握りつぶす（再操作できる）。
    await toggleTag(wordId).catch(() => {});
  };

  return (
    <WordbookListLayout
      header={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SectionTitle
            icon={<FormatListBulletedIcon />}
            subTitle="My Vocabulary Archive"
            title={wordbook.title}
          />
          {/* v1 の .editWordbookButton（青枠ピル）を sx で再現。 */}
          <Box
            component={NextLink}
            href={`/wordbooks/${wordbookId}/edit`}
            sx={{
              background: "transparent",
              border: "1px solid rgba(100,149,237,.6)",
              color: "rgba(100,149,237,.8)",
              p: "4px 10px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              transition: "all .2s ease",
              "&:hover": {
                background: "rgba(100,149,237,.15)",
                color: "#6495ed",
              },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 14 }} />
            編集
          </Box>
        </Box>
      }
      description={
        wordbook.description && (
          <Box>
            <Typography>{wordbook.description}</Typography>
            <Typography>登録単語数：{words.length}</Typography>
          </Box>
        )
      }
      form={
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FloatingInput
            id="question"
            label="単語"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={adding}
            labelIcon={<HelpOutlineIcon />}
            error={findFieldError(errors, "question")}
          />

          <FloatingInput
            id="answer"
            label="意味"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={adding}
            labelIcon={<LightbulbOutlinedIcon />}
            error={findFieldError(errors, "answer")}
          />

          {systemError && (
            <Typography sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}>
              {systemError}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: "10px" }}>
            <Box sx={{ flex: 1 }}>
              <Button type="submit" disabled={adding}>
                単語を登録
              </Button>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Button
                href={`/wordbooks/${wordbookId}/test`}
                disabled={words.length === 0}
                color="#3b82f6"
                hoverColor="#2563eb"
              >
                今すぐはじめる
              </Button>
            </Box>
          </Box>

          {words.length === 0 && (
            <Box
              sx={{
                mt: "20px",
                p: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "1px dashed var(--color-border)",
                borderRadius: "10px",
              }}
            >
              <LightbulbOutlinedIcon
                sx={{ fontSize: 20, color: "var(--color-primary)" }}
              />
              <Typography
                sx={{ fontSize: 13, color: "var(--color-font-secondary)" }}
              >
                単語を登録して、今すぐテストを始めよう！
              </Typography>
            </Box>
          )}
        </Box>
      }
      list={
        <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {words.map((word) =>
            editingId === word.id ? (
              // インライン編集フォーム（カードと同じ枠で中身だけ入力に切り替える）
              <Box
                key={word.id}
                component="form"
                onSubmit={handleUpdate}
                noValidate
                sx={{
                  backgroundColor: "#1f1f1f",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                  p: "20px 16px 12px",
                }}
              >
                <FloatingInput
                  id={`edit-question-${word.id}`}
                  label="単語"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  disabled={updating}
                  labelIcon={<HelpOutlineIcon />}
                  error={findFieldError(editErrors, "question")}
                />
                <FloatingInput
                  id={`edit-answer-${word.id}`}
                  label="意味"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  disabled={updating}
                  labelIcon={<LightbulbOutlinedIcon />}
                  error={findFieldError(editErrors, "answer")}
                />
                {editSystemError && (
                  <Typography
                    sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}
                  >
                    {editSystemError}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: "10px" }}>
                  <Box sx={{ flex: 1 }}>
                    <Button type="submit" disabled={updating}>
                      {updating ? "更新中..." : "保存"}
                    </Button>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Button
                      onClick={() => setEditingId(null)}
                      disabled={updating}
                      color="#3b82f6"
                      hoverColor="#2563eb"
                    >
                      キャンセル
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <WordCard
                key={word.id}
                question={word.question}
                answer={word.answer}
                opened
                review={isTagged(word.id)}
                onTagToggle={() => handleTagToggle(word.id)}
                onEdit={() => startEdit(word)}
                deletable
                onDelete={() => handleDelete(word.id)}
              />
            ),
          )}
        </Box>
      }
    />
  );
}
