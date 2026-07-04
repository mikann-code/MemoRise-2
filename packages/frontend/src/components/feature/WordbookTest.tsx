"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import { SectionTitle, Button, JudgeButtons } from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { useWordbookSession } from "@/components/feature/WordbookSessionProvider";

type Word = { id: string; question: string; answer: string };

type Props = {
  wordbookId: string;
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
 * 「答えを見る」までは正誤ボタンを disabled にして先読みを防ぐ。不正解は復習タグへ自動追加。
 * 完了で結果画面（正答率・間違えた単語一覧）を表示する。
 * #2 には学習記録の保存 API がまだ無いため（#10 で対応）、完了時の記録は行わず
 * セッション状態（復習タグ）の更新のみ（保存なし）。
 */
export default function WordbookTest({ wordbookId, words }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const { isTagged, toggleTag } = useWordbookSession();

  const total = words.length;
  const answeredCount = currentIndex;
  const rate =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const finished = currentIndex >= total;
  const currentWord = words[currentIndex];

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
    if (currentWord && !isTagged(currentWord.id)) toggleTag(currentWord.id);
    setWrongWords((prev) => [...prev, currentWord]);
    goNext();
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

          <Box sx={{ mt: 2.5 }}>
            <Button href={`/wordbooks/${wordbookId}/list`}>一覧に戻る</Button>
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
