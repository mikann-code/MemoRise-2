"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import { SectionTitle, Button, JudgeButtons } from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { useCreateStudyRecordMutation } from "@/graphql/mutations/createStudyRecord";
import { StudyRecordKind } from "@/gql/graphql";

type Word = { id: string; question: string; answer: string };

type Props = {
  /** 復習専用テスト（/wordbooks/review/test）では未指定。記録は単語帳なしで保存し、終了後は復習単語一覧へ戻る。 */
  wordbookId?: string;
  /** シャッフル済みの出題順（ページ側で startTransition を使って並べ替える）。 */
  words: Word[];
};

/** オレンジ→レッドのグラデーション進捗バー（v1 の <progress> を踏襲）。 */
function ProgressBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box
      sx={{
        width: "100%",
        height: 8,
        borderRadius: "999px",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-tertiary)",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${ratio}%`,
          borderRadius: "999px",
          background: "linear-gradient(90deg, #ff9f43, #ff6b6b)",
          transition: "width .3s ease",
        }}
      />
    </Box>
  );
}

function ProgressInfo({ current, total, rate }: { current: number; total: number; rate: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 14,
        color: "#dddddd",
        mb: 0.75,
      }}
    >
      <span>
        {current} / {total} 問目
      </span>
      <span>正答率 {rate}%</span>
    </Box>
  );
}

/**
 * 自作単語帳の単語テスト本体（v1 の TestBody を踏襲。公式単語帳の BasicWordTest と同じ見た目）。
 * 「答えを見る」までは正誤ボタンを disabled にして先読みを防ぐ。
 * 誤答の復習タグは自動登録せず、結果画面の「間違えた単語を復習リストに登録」（confirm あり）で
 * まとめて登録する（docs/frontend.md §5）。
 * 完了で結果画面（正答率・間違えた単語一覧）を表示し、学習記録を 1 回だけ保存する
 * （hasPostedRef で Strict Mode の二重実行・二重送信を防止）。
 * wordbookId なしは復習専用テスト（記録は単語帳なし・戻り先は復習単語一覧）。
 */
export default function WordbookTest({ wordbookId, words }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  // 一括登録（mutation → refetch）中の連打で二重送信しないようにする。
  const [registering, setRegistering] = useState(false);
  const { isTagged, addTags, toggleTag } = useReviewTags();
  const { confirm, notify } = useSnackbar();
  const [createStudyRecord] = useCreateStudyRecordMutation();
  const hasPostedRef = useRef(false);

  const total = words.length;
  const answeredCount = currentIndex;
  const rate =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const finished = currentIndex >= total;
  const currentWord = words[currentIndex];

  // テスト終了を検知して学習記録を 1 回だけ保存する。保存失敗でも結果画面はそのまま
  // 表示する（記録はベストエフォート。v1 の fire-and-forget を踏襲）。
  // 記録の種類は kind で明示する（単語帳ありは WORDBOOK、復習専用テストは REVIEW）。
  useEffect(() => {
    if (!finished || total === 0 || hasPostedRef.current) return;
    hasPostedRef.current = true;
    createStudyRecord({
      variables: wordbookId
        ? {
            kind: StudyRecordKind.Wordbook,
            totalCount: total,
            correctCount,
            wordbookId,
          }
        : { kind: StudyRecordKind.Review, totalCount: total, correctCount },
    }).catch(() => {});
  }, [finished, total, correctCount, wordbookId, createStudyRecord]);

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
          <Box sx={{ mb: 5 }}>
            <ProgressInfo current={total} total={total} rate={rate} />
            <ProgressBar value={total} max={total} />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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

          <Box
            sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {untaggedWrongWords.length > 0 && (
              <Button onClick={handleRegisterWrongWords} disabled={registering}>
                間違えた単語を復習リストに登録
              </Button>
            )}
            <Button
              href={
                wordbookId
                  ? `/wordbooks/${wordbookId}/list`
                  : "/wordbooks/review"
              }
            >
              一覧に戻る
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
        subTitle={wordbookId ? "Words Test" : "Review Test"}
        title={wordbookId ? "単語テスト" : "復習テスト"}
      />

      <Box
        sx={{
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: "16px",
          p: 2.5,
          mt: 2.5,
        }}
      >
        <Box sx={{ mb: 5 }}>
          <ProgressInfo current={currentIndex + 1} total={total} rate={rate} />
          <ProgressBar value={answeredCount} max={total} />
        </Box>

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
