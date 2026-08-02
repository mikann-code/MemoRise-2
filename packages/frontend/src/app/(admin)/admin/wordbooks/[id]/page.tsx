"use client";

import { type FormEvent, use, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Button,
  FloatingInput,
  FormError,
  LoadingContainer,
  EmptyState,
} from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { useAdminWordbookQuery } from "@/graphql/queries/adminWordbook";
import { useCreateAdminWordbookMutation } from "@/graphql/mutations/createAdminWordbook";
import { useCreateAdminWordMutation } from "@/graphql/mutations/createAdminWord";
import { useUpdateAdminWordMutation } from "@/graphql/mutations/updateAdminWord";
import { useDeleteAdminWordMutation } from "@/graphql/mutations/deleteAdminWord";
import { useSetAdminWordbookStatusMutation } from "@/graphql/mutations/setAdminWordbookStatus";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { statusLabel } from "@/constants/wordbookStatuses";
import { WordbookStatus } from "@/gql/graphql";
import {
  pickFieldError,
  pickSystemError,
  type FieldError,
} from "@/lib/forms/fieldErrors";
import AdminPageHeader from "../../_components/AdminPageHeader";

/**
 * 公式単語帳の詳細（管理）。教材（親）なら章の一覧・追加を、章なら単語の追加 / 編集 / 削除・
 * CSV 一括登録への導線を提供する。教材→章→単語をこの 1 画面の遷移で辿る。
 * 教材は章の入れ物で単語を直接持たない設計のため、教材では単語セクションを出さない
 * （バックエンドの createAdminWord / importCsv も教材への登録を拒否する）。
 */

// 各フォームの入力欄に対応する field（章追加の title・単語の question/answer・並び順）。
// これ以外（system / id 等）は systemError にまとめる。章・単語追加・単語編集で共通に使う。
const KNOWN_FIELDS = ["question", "answer", "title", "orderIndex"];

type Props = { params: Promise<{ id: string }> };

export default function AdminWordbookDetailPage({ params }: Props) {
  const { id } = use(params);
  const { confirm, notify } = useSnackbar();

  const { data, loading, error, refetch } = useAdminWordbookQuery({
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const wordbook = data?.adminWordbook ?? null;
  const isTopLevel = wordbook != null && wordbook.parentId == null;
  const isDraft = wordbook?.status === WordbookStatus.Draft;

  const [createChapter, { loading: addingChapter }] = useCreateAdminWordbookMutation();
  const [createWord, { loading: addingWord }] = useCreateAdminWordMutation();
  const [updateWord, { loading: updatingWord }] = useUpdateAdminWordMutation();
  const [deleteWord] = useDeleteAdminWordMutation();
  const [setStatus, { loading: switchingStatus }] = useSetAdminWordbookStatusMutation();

  // 章の追加フォーム（並び順は BE が末尾に自動採番するため入力欄は持たない）
  const [chTitle, setChTitle] = useState("");
  const [chErrors, setChErrors] = useState<FieldError[]>([]);

  // 単語の追加フォーム
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [wordErrors, setWordErrors] = useState<FieldError[]>([]);

  // 単語のインライン編集
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editErrors, setEditErrors] = useState<FieldError[]>([]);

  if (loading && !data) {
    return (
      <LoadingContainer />
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography sx={{ color: "var(--color-error)" }}>
          公式単語帳の取得に失敗しました。
        </Typography>
      </Container>
    );
  }

  if (!wordbook) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <AdminPageHeader title="公式単語帳" backHref="/admin/wordbooks" backLabel="公式単語帳の管理" />
        <Typography sx={{ color: "var(--color-font-secondary)" }}>
          公式単語帳が見つかりませんでした。
        </Typography>
      </Container>
    );
  }

  const chapters = wordbook.children;
  const words = wordbook.words;
  const backHref = isTopLevel ? "/admin/wordbooks" : `/admin/wordbooks/${wordbook.parentId}`;

  const handleAddChapter = async (e: FormEvent) => {
    e.preventDefault();
    setChErrors([]);
    if (!chTitle.trim()) {
      setChErrors([{ field: "title", message: "章タイトルを入力してください" }]);
      return;
    }
    try {
      const { data: result } = await createChapter({
        variables: {
          title: chTitle,
          parentId: id,
        },
      });
      const payload = result?.createAdminWordbook;
      if (!payload?.success) {
        setChErrors(
          payload?.errors?.length
            ? payload.errors.map((e) => ({ field: e.field, message: e.message }))
            : [{ field: "system", message: "章の作成に失敗しました" }],
        );
        return;
      }
      setChTitle("");
      await refetch();
    } catch {
      setChErrors([{ field: "system", message: "章の作成に失敗しました" }]);
    }
  };

  const handleAddWord = async (e: FormEvent) => {
    e.preventDefault();
    setWordErrors([]);
    const next: FieldError[] = [];
    if (!question.trim()) next.push({ field: "question", message: "単語を入力してください" });
    if (!answer.trim()) next.push({ field: "answer", message: "意味を入力してください" });
    if (next.length) {
      setWordErrors(next);
      return;
    }
    try {
      const { data: result } = await createWord({
        variables: { wordbookId: id, question, answer },
      });
      const payload = result?.createAdminWord;
      if (!payload?.success) {
        setWordErrors(
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
      setWordErrors([{ field: "system", message: "登録に失敗しました" }]);
    }
  };

  const startEdit = (word: { id: string; question: string; answer: string }) => {
    setEditingId(word.id);
    setEditQuestion(word.question);
    setEditAnswer(word.answer);
    setEditErrors([]);
  };

  const handleUpdateWord = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditErrors([]);
    const next: FieldError[] = [];
    if (!editQuestion.trim()) next.push({ field: "question", message: "単語を入力してください" });
    if (!editAnswer.trim()) next.push({ field: "answer", message: "意味を入力してください" });
    if (next.length) {
      setEditErrors(next);
      return;
    }
    try {
      const { data: result } = await updateWord({
        variables: { id: editingId, question: editQuestion, answer: editAnswer },
      });
      const payload = result?.updateAdminWord;
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

  const handleDeleteWord = async (wordId: string) => {
    try {
      const { data: result } = await deleteWord({ variables: { id: wordId } });
      if (!result?.deleteAdminWord?.success) notify("削除に失敗しました");
    } catch {
      notify("削除に失敗しました");
    } finally {
      await refetch();
    }
  };

  // 公開状態の切り替え（教材のみ）。確認 → 切り替え → 通知。章へは BE 側で伝播する。
  const handleToggleStatus = async () => {
    const toDraft = wordbook?.status === WordbookStatus.Published;

    const ok = await confirm(
      toDraft
        ? "この教材の公開を停止しますか？\n一般ユーザーの一覧から表示されなくなります。"
        : "この教材を公開しますか？\n一般ユーザーの一覧に表示されます。",
    );
    if (!ok) return;

    try {
      const { data: result } = await setStatus({
        variables: {
          id,
          status: toDraft ? WordbookStatus.Draft : WordbookStatus.Published,
        },
      });
      if (!result?.setAdminWordbookStatus?.success) {
        notify("公開状態の変更に失敗しました");
        return;
      }
      notify(toDraft ? "公開を停止しました" : "公開しました");
    } catch {
      notify("公開状態の変更に失敗しました");
    } finally {
      await refetch();
    }
  };

  const chSystemError = pickSystemError(chErrors, KNOWN_FIELDS);
  const wordSystemError = pickSystemError(wordErrors, KNOWN_FIELDS);
  const editSystemError = pickSystemError(editErrors, KNOWN_FIELDS);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader
        title={wordbook.title}
        backHref={backHref}
        backLabel="戻る"
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* 公開状態の切り替えは教材（親）単位。章は親に追従するのでトグルを出さない。 */}
            {isTopLevel && (
              <Button
                size="compact"
                onClick={handleToggleStatus}
                disabled={switchingStatus}
                color={isDraft ? "#16a34a" : "#b45309"}
                hoverColor={isDraft ? "#15803d" : "#92400e"}
              >
                {isDraft ? "公開する" : "公開を停止"}
              </Button>
            )}
            <Button
              href={`/admin/wordbooks/${id}/edit`}
              size="compact"
              color="#3b82f6"
              hoverColor="#2563eb"
            >
              <EditOutlinedIcon sx={{ fontSize: 16 }} /> 編集
            </Button>
          </Box>
        }
      />

      {/* 公開状態のバッジ。章は親に追従するため教材のときだけ出す。 */}
      {isTopLevel && (
        <Chip
          size="small"
          label={statusLabel(wordbook.status)}
          color={isDraft ? "warning" : "success"}
          variant={isDraft ? "filled" : "outlined"}
          sx={{ mb: 2 }}
        />
      )}

      {wordbook.description && (
        <Typography sx={{ color: "#bbbbbb", fontSize: 14, mb: 3 }}>
          {wordbook.description}
        </Typography>
      )}

      {/* 章（教材のときのみ） */}
      {isTopLevel && (
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: "4px" }}>
            章（{chapters.length}）
          </Typography>
          <Typography sx={{ color: "var(--color-font-secondary)", fontSize: 13, mb: "12px" }}>
            単語は章の中に登録します。章を追加して、章の詳細から登録してください。
          </Typography>

          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mb: 2 }}>
            {/* 章番号は持たず、order_index 昇順の並び位置から「1. 2. …」を導出する */}
            {chapters.map((c, i) => (
              <Box component="li" key={c.id} sx={{ mb: "8px" }}>
                <Box
                  component={NextLink}
                  href={`/admin/wordbooks/${c.id}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#2a2a2a",
                    borderRadius: "12px",
                    p: "12px 14px",
                    textDecoration: "none",
                    color: "#fff",
                    "&:hover": { background: "#323232" },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                      {i + 1}. {c.title}
                    </Typography>
                    <Typography sx={{ color: "#aaaaaa", fontSize: 12 }}>
                      words: {c.wordsCount}
                    </Typography>
                    <Typography sx={{ color: "#aaaaaa", fontSize: 12 }}>
                      order: {c.orderIndex ?? "-"}
                    </Typography>
                  </Box>
                  <ChevronRightIcon sx={{ color: "#888888" }} />
                </Box>
              </Box>
            ))}
          </Box>

          <Box
            component="form"
            onSubmit={handleAddChapter}
            noValidate
            sx={{
              background: "#1f1f1f",
              border: "1px solid var(--color-border)",
              borderRadius: "14px",
              p: "16px",
            }}
          >
            <Typography sx={{ fontSize: 14, color: "#bbbbbb", mb: 1 }}>
              章を追加
            </Typography>
            <FloatingInput
              id="chapter-title"
              label="章タイトル"
              value={chTitle}
              onChange={(e) => setChTitle(e.target.value)}
              disabled={addingChapter}
              labelIcon={<MenuBookOutlinedIcon />}
              error={pickFieldError(chErrors, "title")}
            />
            <FormError message={chSystemError} />
            <Button type="submit" disabled={addingChapter}>
              {addingChapter ? "追加中..." : "章を追加"}
            </Button>
          </Box>
        </Box>
      )}

      {/* 単語（章のときのみ。教材は単語を直接持たない） */}
      {!isTopLevel && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: "12px",
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              単語（{words.length}）
            </Typography>
            <Button
              href={`/admin/wordbooks/${id}/import`}
              size="compact"
              color="#3b82f6"
              hoverColor="#2563eb"
            >
              <UploadFileIcon sx={{ fontSize: 16 }} /> CSV 取込
            </Button>
          </Box>

          <Box
            component="form"
            onSubmit={handleAddWord}
            noValidate
            sx={{
              background: "#1f1f1f",
              border: "1px solid var(--color-border)",
              borderRadius: "14px",
              p: "16px",
              mb: 2,
            }}
          >
            <FloatingInput
              id="question"
              label="単語"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={addingWord}
              labelIcon={<HelpOutlineIcon />}
              error={pickFieldError(wordErrors, "question")}
            />
            <FloatingInput
              id="answer"
              label="意味"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={addingWord}
              labelIcon={<LightbulbOutlinedIcon />}
              error={pickFieldError(wordErrors, "answer")}
            />
            <FormError message={wordSystemError} />
            <Button type="submit" disabled={addingWord}>
              {addingWord ? "登録中..." : "単語を登録"}
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {words.map((word) =>
              editingId === word.id ? (
                <Box
                  key={word.id}
                  component="form"
                  onSubmit={handleUpdateWord}
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
                    disabled={updatingWord}
                    labelIcon={<HelpOutlineIcon />}
                    error={pickFieldError(editErrors, "question")}
                  />
                  <FloatingInput
                    id={`edit-answer-${word.id}`}
                    label="意味"
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    disabled={updatingWord}
                    labelIcon={<LightbulbOutlinedIcon />}
                    error={pickFieldError(editErrors, "answer")}
                  />
                  <FormError message={editSystemError} />
                  <Box sx={{ display: "flex", gap: "10px" }}>
                    <Box sx={{ flex: 1 }}>
                      <Button type="submit" disabled={updatingWord}>
                        {updatingWord ? "更新中..." : "保存"}
                      </Button>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={updatingWord}
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
                  showTag={false}
                  onEdit={() => startEdit(word)}
                  deletable
                  onDelete={() => handleDeleteWord(word.id)}
                />
              ),
            )}
            {words.length === 0 && (
              <EmptyState
                icon={<LightbulbOutlinedIcon />}
                title="単語がありません"
                description="フォームまたは CSV 取込から登録してください。"
              />
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
}
