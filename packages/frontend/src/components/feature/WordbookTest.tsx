"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkRemoveOutlinedIcon from "@mui/icons-material/BookmarkRemoveOutlined";
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
import { MOBILE_QUERY } from "@/constants/ui";

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

// キーボード操作のヒント行。タッチ端末には無意味なので 768px 以下では出さない。
const keyHintSx = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "4px 16px",
  mt: 1.5,
  fontSize: 12,
  color: "var(--color-font-secondary)",
  [MOBILE_QUERY]: { display: "none" },
} as const;

const kbdSx = {
  display: "inline-block",
  minWidth: 18,
  px: "5px",
  mx: "2px",
  border: "1px solid var(--color-border)",
  borderBottomWidth: 2,
  borderRadius: "4px",
  fontFamily: "var(--font-secondary)",
  fontSize: 11,
  lineHeight: "16px",
  textAlign: "center",
  color: "var(--color-font-primary)",
} as const;

/** Fisher–Yates で出題順をシャッフルする（元配列は変えない）。 */
function shuffle(words: readonly Word[]): Word[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Props = {
  /**
   * 出題対象の単語帳 ID（自作単語帳はその単語帳、公式単語帳は章の ID）。
   * 復習専用テスト（/wordbooks/review/test）では未指定にする。指定の有無で
   * 見出しと結果画面の一括操作（登録 / 解除）が切り替わる。
   */
  wordbookId?: string;
  /** 公式単語帳の章のテストで true。完了時に章を完了扱いにして次の Part を解放する。 */
  completesChapter?: boolean;
  /** 結果画面の「一覧に戻る」の遷移先。 */
  backHref: string;
  /** 出題する単語。シャッフルはこのコンポーネントの中で 1 回だけ行う。 */
  words: readonly Word[];
};

/**
 * 単語テスト本体（v1 の TestBody を踏襲）。自作単語帳 / 復習専用 / 公式単語帳の章の
 * 3 経路が共通で使う。
 * 「答えを見る」までは正誤ボタンを disabled にして先読みを防ぐ。キーボードでも進められる
 * （Space・Enter で答えを見る → 1 / ← で正解、2 / → で不正解。並びは画面のボタンと同じ）。
 * 誤答の復習タグは自動登録せず、結果画面の「間違えた単語を復習リストに登録」（confirm あり）で
 * まとめて登録する（docs/frontend.md §5）。
 * 完了で結果画面（スコアのサマリー → 一括操作 → 間違えた単語一覧）を表示し、学習記録を 1 回だけ
 * 保存する（hasPostedRef で Strict Mode の二重実行・二重送信を防止）。completesChapter 指定時は
 * 章の完了（次 Part 解放）も同じタイミングで 1 回だけ送る。記録・進捗はいずれもベストエフォートで、
 * 失敗しても結果画面はそのまま表示する（v1 の fire-and-forget を踏襲）。
 * 結果画面の一括操作は wordbookId で役割を分ける：単語帳のテスト（自作・公式）は「登録」だけ、
 * 復習専用テストは対になる「覚えた単語を外す」だけを出し、両方が並ばないようにする。
 */
export default function WordbookTest({
  wordbookId,
  completesChapter = false,
  backHref,
  words: initial,
}: Props) {
  // 出題順はマウント時に 1 回だけ固定する。テスト中にタグ操作の refetch で親から
  // 新しい words が来ても、出題順・出題数は変えない。
  const [words] = useState(() => shuffle(initial));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [correctWords, setCorrectWords] = useState<Word[]>([]);
  // 一括操作（mutation → refetch）中の連打で二重送信しないようにする。
  const [registering, setRegistering] = useState(false);
  const { isTagged, addTags, removeTags, toggleTag } = useReviewTags();
  const { confirm, notify } = useSnackbar();
  const [createStudyRecord] = useCreateStudyRecordMutation();
  const [completeWordbookProgress] = useCompleteWordbookProgressMutation();
  const hasPostedRef = useRef(false);

  const total = words.length;
  const answeredCount = currentIndex;
  const rate =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const finished = currentIndex >= total;
  const currentWord = words[currentIndex];

  // テスト終了を検知して、学習記録（と公式単語帳なら章の完了）を 1 回だけ送る。
  // 記録の種類は kind で明示する（単語帳ありは WORDBOOK、復習専用テストは REVIEW）。
  useEffect(() => {
    if (!finished || total === 0 || hasPostedRef.current) return;
    hasPostedRef.current = true;
    if (completesChapter && wordbookId) {
      completeWordbookProgress({ variables: { wordbookId } }).catch(() => {});
    }
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
  }, [
    finished,
    total,
    correctCount,
    wordbookId,
    completesChapter,
    createStudyRecord,
    completeWordbookProgress,
  ]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setOpened(false);
  }, []);

  const handleCorrect = useCallback(() => {
    setCorrectCount((prev) => prev + 1);
    setCorrectWords((prev) => [...prev, currentWord]);
    goNext();
  }, [currentWord, goNext]);

  const handleWrong = useCallback(() => {
    setWrongWords((prev) => [...prev, currentWord]);
    goNext();
  }, [currentWord, goNext]);

  // キーボードでも出題を回せるようにする。判定はボタンと同じハンドラを呼ぶだけで、
  // ロジックは二重に持たない。キーの左右は画面のボタンの並び（左 = 正解 / 右 = 不正解）に合わせる。
  useEffect(() => {
    if (finished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 長押しのリピートと、ショートカット（Ctrl + F 等）には反応しない。
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      // 入力中は横取りしない。
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (target?.isContentEditable) return;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "Enter") {
        // Space の既定動作（ページスクロール）と、フォーカス中のボタンの再発火を止める。
        e.preventDefault();
        setOpened(true);
        return;
      }
      // 答えを開くまでは判定させない（ボタンの disabled と同じ制約）。
      if (!opened) return;

      if (e.key === "1" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleCorrect();
      } else if (e.key === "2" || e.key === "ArrowRight") {
        e.preventDefault();
        handleWrong();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finished, opened, handleCorrect, handleWrong]);

  // 結果画面の一括操作の対象。「登録 = 単語帳のテスト（自作・公式）」「解除 = 復習専用テスト」と
  // 役割を分け、どちらも wordbookId の有無で開閉する（結果画面に両方が並ばないようにする）。
  // 登録：誤答のうち未タグの単語（全て登録済みならボタンごと消える）。
  const untaggedWrongWords = wordbookId
    ? wrongWords.filter((w) => !isTagged(w.id))
    : [];

  // 解除：正解した単語のうち、まだタグが付いているもの。間違えた単語は復習リストに残す。
  // 解除し終えるとボタンごと消える（登録側と対称）。
  const taggedCorrectWords = wordbookId
    ? []
    : correctWords.filter((w) => isTagged(w.id));

  // 公式単語帳、自作単語帳専用
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

  // 復習単語帳専用
  // 覚えた単語（このテストで正解した単語）をまとめて復習リストから外す。
  // 1 件ずつタグアイコンを押す後片付けを、テスト直後にまとめて済ませるための導線。
  const handleRemoveCorrectWords = async () => {
    if (registering) return;
    const targets = taggedCorrectWords;
    if (
      !(await confirm(
        `正解した単語 ${targets.length} 件を復習リストから外しますか？`,
      ))
    ) {
      return;
    }
    setRegistering(true);
    try {
      await removeTags(targets.map((w) => w.id));
      notify("復習リストから外しました");
    } catch {
      notify("復習リストの更新に失敗しました");
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

          {/* 一括操作はサマリーの直下（誤答一覧より前）に置き、結果を見てそのまま復習へ回せるようにする。
              登録 = 単語帳のテスト（自作・公式）／解除 = 復習専用テストで、どちらか一方だけが出る。 */}
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
          {taggedCorrectWords.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Button onClick={handleRemoveCorrectWords} disabled={registering}>
                <Box component="span" sx={buttonContentSx}>
                  <BookmarkRemoveOutlinedIcon sx={{ fontSize: 18 }} />
                  覚えた単語を外す
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
            <Button href={backHref} color="#3b82f6" hoverColor="#2563eb">
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

        <Box sx={keyHintSx}>
          <Box component="span">
            <Box component="kbd" sx={kbdSx}>
              Space
            </Box>
            答えを見る
          </Box>
          <Box component="span">
            <Box component="kbd" sx={kbdSx}>
              1
            </Box>
            <Box component="kbd" sx={kbdSx}>
              ←
            </Box>
            正解
          </Box>
          <Box component="span">
            <Box component="kbd" sx={kbdSx}>
              2
            </Box>
            <Box component="kbd" sx={kbdSx}>
              →
            </Box>
            不正解
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
