"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import {
  SectionTitle,
  Button,
  JudgeButtons,
  TestProgress,
  TestResultSummary,
} from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { useCreateStudyRecordMutation } from "@/graphql/mutations/createStudyRecord";
import { useCompleteWordbookProgressMutation } from "@/graphql/mutations/completeWordbookProgress";
import { StudyRecordKind } from "@/gql/graphql";

type Word = { id: string; question: string; answer: string };

// 結果画面のボタン内容（アイコン + 文字）を中央寄せする共通 sx。
// Button は既定サイズだと display:block なので、子側で中央寄せを担う。
// アイコンの有無で高さがぶれないよう、一覧に戻る（アイコンなし）も同じ構造で包む。
const buttonContentSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
} as const;

type Props = {
  parentId: string;
  chapterId: string;
  words: Word[];
};

/** Fisher–Yates で出題順をシャッフルする（元配列は変えない）。 */
function shuffle(words: Word[]): Word[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 公式単語帳の単語テスト本体（v1 の TestBody を踏襲）。
 * 「答えを見る」までは正誤ボタンを disabled にして先読みを防ぐ。
 * 誤答の復習タグは自動追加せず、結果画面の「間違えた単語を復習リストに登録」（confirm あり）で
 * まとめて登録する（自作単語帳の WordbookTest と同じ UX）。復習タグはバックエンド保存
 * （ReviewTagProvider）で自作単語帳と共通の復習単語一覧に載る。章の完了扱い（次 Part 解放）も
 * バックエンド保存（completeWordbookProgress）で永続化する。
 * 完了時は学習記録も保存する（kind = WORDBOOK・章の単語帳 ID を wordbookId に渡す。
 * 記録・進捗はベストエフォートで失敗しても結果画面は表示する。二重送信は completedRef で防止）。
 */
export default function PublicWordbookTest({
  parentId,
  chapterId,
  words: initial,
}: Props) {
  const [words] = useState(() => shuffle(initial));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  // 一括登録（mutation → refetch）中の連打で二重送信しないようにする。
  const [registering, setRegistering] = useState(false);
  const { isTagged, addTags, toggleTag } = useReviewTags();
  const { confirm, notify } = useSnackbar();
  const [createStudyRecord] = useCreateStudyRecordMutation();
  const [completeWordbookProgress] = useCompleteWordbookProgressMutation();
  const completedRef = useRef(false);

  const total = words.length;
  const answeredCount = currentIndex;
  const rate =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const finished = currentIndex >= total;
  const currentWord = words[currentIndex];

  // 完了時に章を完了扱いにし（次 Part 解放）、学習記録を保存する。多重実行を ref で
  // 一度きりに抑える。いずれもベストエフォート（失敗しても結果画面はそのまま表示する）。
  useEffect(() => {
    if (finished && total > 0 && !completedRef.current) {
      completedRef.current = true;
      completeWordbookProgress({
        variables: { wordbookId: chapterId },
      }).catch(() => {});
      createStudyRecord({
        variables: {
          kind: StudyRecordKind.Wordbook,
          totalCount: total,
          correctCount,
          wordbookId: chapterId,
        },
      }).catch(() => {});
    }
  }, [
    finished,
    total,
    correctCount,
    chapterId,
    completeWordbookProgress,
    createStudyRecord,
  ]);

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setOpened(false);
    } else {
      setCurrentIndex(total);
    }
  };

  const handleCorrect = () => {
    setCorrectCount((prev) => prev + 1);
    goNext();
  };

  const handleWrong = () => {
    setWrongWords((prev) => [...prev, currentWord]);
    goNext();
  };

  // 結果画面の一括登録対象（既にタグ済みの単語は除く。全て登録済みならボタンごと消える）。
  const untaggedWrongWords = wrongWords.filter((w) => !isTagged(w.id));

  const handleRegisterWrongWords = async () => {
    if (registering) return;
    const targets = untaggedWrongWords;
    if (
      !(await confirm(
        `間違えた単語 ${targets.length} 件を復習リストに登録しますか？`,
      ))
    ) {
      return;
    }
    setRegistering(true);
    try {
      await addTags(targets.map((w) => w.id));
      notify("復習リストに登録しました");
    } catch {
      notify("復習リストへの登録に失敗しました");
    } finally {
      setRegistering(false);
    }
  };

  if (finished) {
    return (
      <Box>
        <SectionTitle
          icon={<DriveFileRenameOutlineOutlinedIcon />}
          subTitle="Result"
          title="テスト結果"
        />

        <Box sx={{ mt: 2 }}>
          {/* 一番上でスコア（何問正解したか）を見せる。 */}
          <TestResultSummary correctCount={correctCount} total={total} />

          {/* 一括登録はサマリーの直下（誤答一覧より前）に置き、結果を見てそのまま復習へ回せるようにする。 */}
          {untaggedWrongWords.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Button onClick={handleRegisterWrongWords} disabled={registering}>
                <Box component="span" sx={buttonContentSx}>
                  <BookmarkAddOutlinedIcon sx={{ fontSize: 18 }} />
                  間違えた単語 {untaggedWrongWords.length} 件を復習リストに登録
                </Box>
              </Button>
            </Box>
          )}

          {wrongWords.length > 0 ? (
            <>
              <Typography
                sx={{
                  mt: 3,
                  fontSize: 12,
                  color: "var(--color-font-secondary)",
                }}
              >
                間違えた単語（{wrongWords.length} 件）
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  mt: 1.25,
                }}
              >
                {wrongWords.map((w) => (
                  <WordCard
                    key={w.id}
                    question={w.question}
                    answer={w.answer}
                    opened
                    review={isTagged(w.id)}
                    onTagToggle={() => toggleTag(w.id)}
                    deletable={false}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Typography
              sx={{
                mt: 3,
                fontSize: 13,
                textAlign: "center",
                color: "var(--color-font-secondary)",
              }}
            >
              全問正解！間違えた単語はありません。
            </Typography>
          )}

          <Box sx={{ mt: 2.5 }}>
            <Button
              href={`/publicWordbooks/${parentId}/${chapterId}/list`}
              color="#3b82f6"
              hoverColor="#2563eb"
            >
              {/* 上のボタンと高さを揃えるため、素のテキストも同じ flex 中央寄せで包む。 */}
              <Box component="span" sx={buttonContentSx}>
                一覧に戻る
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <SectionTitle
        icon={<DriveFileRenameOutlineOutlinedIcon />}
        subTitle="Words Test"
        title="単語テスト"
      />

      <Box
        sx={{
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: "16px",
          p: 2.5,
          mt: 2.5,
        }}
      >
        <TestProgress
          current={currentIndex + 1}
          total={total}
          rate={rate}
          filled={answeredCount}
        />

        <WordCard
          question={currentWord.question}
          answer={currentWord.answer}
          opened={opened}
          review={isTagged(currentWord.id)}
          onTagToggle={() => toggleTag(currentWord.id)}
          deletable={false}
        />

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: "12px", mt: 5 }}
        >
          <Button onClick={() => setOpened(true)} disabled={opened}>
            {opened ? "答えを表示中" : "答えを見る"}
          </Button>
          <JudgeButtons
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            disabled={!opened}
          />
        </Box>
      </Box>
    </Box>
  );
}
