"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import { SectionTitle, Button, JudgeButtons } from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { usePublicWordbookSession } from "@/components/feature/PublicWordbookSessionProvider";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import { useCreateStudyRecordMutation } from "@/graphql/mutations/createStudyRecord";
import { StudyRecordKind } from "@/gql/graphql";

type Word = { id: string; question: string; answer: string };

// 結果画面のボタン内容（アイコン + 文字）を中央寄せする共通 sx。
// アイコン有無で行ボックスの高さがぶれないよう、登録／一覧に戻るの両ボタンで同じ構造にして
// 縦位置を揃える（Button は既定サイズだと display:block なので子側で中央寄せを担う）。
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
 * 公式単語帳の単語テスト本体（v1 の TestBody を踏襲）。
 * 「答えを見る」までは正誤ボタンを disabled にして先読みを防ぐ。
 * 誤答の復習タグは自動追加せず、結果画面の「間違えた単語を復習リストに登録」（confirm あり）で
 * まとめて登録する（自作単語帳の WordbookTest と同じ UX）。復習タグはバックエンド保存
 * （ReviewTagProvider）で自作単語帳と共通の復習単語一覧に載る。章の完了扱い（次 Part 解放）だけ
 * まだ保存 API が無いため PublicWordbookSessionProvider の一時状態を使う。
 * 完了時は学習記録も保存する（kind = WORDBOOK・章の単語帳 ID を wordbookId に渡す。
 * 記録はベストエフォートで失敗しても結果画面は表示する。二重送信は completedRef で防止）。
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
  const { markCompleted } = usePublicWordbookSession();
  const { isTagged, addTags, toggleTag } = useReviewTags();
  const { confirm, notify } = useSnackbar();
  const [createStudyRecord] = useCreateStudyRecordMutation();
  const completedRef = useRef(false);

  const total = words.length;
  const answeredCount = currentIndex;
  const rate =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const finished = currentIndex >= total;
  const currentWord = words[currentIndex];

  // 完了時に章を完了扱いにし（次 Part 解放）、学習記録を保存する。多重実行を ref で
  // 一度きりに抑える。記録はベストエフォート（失敗しても結果画面はそのまま表示する）。
  useEffect(() => {
    if (finished && total > 0 && !completedRef.current) {
      completedRef.current = true;
      markCompleted(chapterId);
      createStudyRecord({
        variables: {
          kind: StudyRecordKind.Wordbook,
          totalCount: total,
          correctCount,
          wordbookId: chapterId,
        },
      }).catch(() => {});
    }
  }, [finished, total, correctCount, chapterId, markCompleted, createStudyRecord]);

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

          {/* 登録（復習ブランドのオレンジ + アイコン）と一覧へ戻る（青系）を横並びに。
              色とアイコンで役割を区別し、同色 2 連ボタンを避ける。 */}
          <Box
            sx={{ mt: 2.5, display: "flex", alignItems: "stretch", gap: "12px" }}
          >
            {untaggedWrongWords.length > 0 && (
              <Box sx={{ flex: 1 }}>
                <Button onClick={handleRegisterWrongWords} disabled={registering}>
                  <Box component="span" sx={buttonContentSx}>
                    <BookmarkAddOutlinedIcon sx={{ fontSize: 18 }} />
                    復習リストに登録
                  </Box>
                </Button>
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Button
                href={`/publicWordbooks/${parentId}/${chapterId}/list`}
                color="#3b82f6"
                hoverColor="#2563eb"
              >
                {/* 登録ボタンと縦位置を揃えるため、素のテキストも同じ flex 中央寄せで包む。 */}
                <Box component="span" sx={buttonContentSx}>
                  一覧に戻る
                </Box>
              </Button>
            </Box>
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
