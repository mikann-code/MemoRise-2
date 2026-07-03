"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { SectionTitle, LoadingSpinner, Button } from "@/components/common/ui";
import { usePublicWordbookQuery } from "@/graphql/queries/publicWordbook";
import { useBasicWordSession } from "@/components/feature/BasicWordSessionProvider";

/**
 * 公式単語帳の親 1 件（教材トップ）。子＝章（Part）を縦に並べ、番号バッジ・進捗バー・解放状態で見せる。
 * v1（memorize）の basicWord/[parentId] を踏襲。解放/完了は #2 にまだ保存 API が無いため、
 * BasicWordSession（クライアント一時状態）から算出する：先頭 Part か「前の Part を完了」で解放。
 */
export default function BasicWordParentPage() {
  const { parentId } = useParams<{ parentId: string }>();
  const { data, loading, error } = usePublicWordbookQuery({
    variables: { id: parentId },
  });
  const { completedIds } = useBasicWordSession();

  const wordbook = data?.publicWordbook ?? null;

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error || !wordbook || wordbook.children.length === 0) {
    return (
      <Box>
        <Typography component="h2" sx={{ fontSize: 20, mb: 1 }}>
          😢 教材が見つかりません
        </Typography>
        <Typography sx={{ color: "var(--color-font-secondary)", mb: 2 }}>
          この教材の単語データがありません。
        </Typography>
        <Box
          component={NextLink}
          href="/basicWordList"
          sx={{ color: "var(--color-primary)" }}
        >
          ← 一覧へ戻る
        </Box>
      </Box>
    );
  }

  const children = wordbook.children;
  // 解放判定：先頭 Part は常に解放。以降は「直前 Part を完了済み」なら解放。
  const parts = children.map((child, index) => ({
    ...child,
    completed: completedIds.has(child.id),
    unlocked: index === 0 || completedIds.has(children[index - 1].id),
  }));

  const completedCount = parts.filter((p) => p.completed).length;
  const totalCount = parts.length;
  const progressRatio =
    totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  // 「今すぐはじめる」の飛び先：未完了で解放済みの先頭 Part（無ければ先頭の解放 Part）。
  const startPart =
    parts.find((p) => p.unlocked && !p.completed) ??
    parts.find((p) => p.unlocked);

  return (
    <Box>
      <SectionTitle
        icon={<AssignmentTurnedInOutlinedIcon />}
        subTitle="Words Overview"
        title="公式単語集"
      />

      <Typography sx={{ color: "#cccccc", my: 1.5, lineHeight: 1.7 }}>
        各 Part の単語リストはいつでも確認できます。
        <br />
        テストを完了すると、次の Part が順番に解放されていきます。
      </Typography>

      {startPart && (
        <Button href={`/basicWord/${parentId}/${startPart.id}/test`}>
          今すぐはじめる
        </Button>
      )}

      <Box sx={{ mt: 2, mb: 2.5 }}>
        <Typography sx={{ fontSize: 13, color: "#aaaaaa", mb: 0.75 }}>
          進捗：{completedCount} / {totalCount} Part 完了
        </Typography>
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
              width: `${progressRatio}%`,
              borderRadius: "999px",
              background: "linear-gradient(90deg, #ff9f43, #ff6b6b)",
              transition: "width .3s ease",
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: "10px", mt: 3.75 }}
      >
        {parts.map((part, index) => {
          const prevCompleted = index > 0 && parts[index - 1].completed;
          const chapterLabel = part.part ? `第${part.part}章` : part.title;

          return (
            <Box
              key={part.id}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* 縦の連結線（先頭以外）。前の Part が完了なら primary で点灯。 */}
              {index > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "-10px",
                    left: 20,
                    transform: "translateX(-50%)",
                    width: 2,
                    height: 10,
                    backgroundColor: prevCompleted
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  }}
                />
              )}

              {part.unlocked ? (
                <Box
                  component={NextLink}
                  href={`/basicWord/${parentId}/${part.id}/test`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    width: "100%",
                    "&:hover .chapter-title": {
                      color: "var(--color-font-primary)",
                      transition: "all .2s ease",
                    },
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      fontWeight: "bold",
                      backgroundColor: part.completed
                        ? "var(--color-primary)"
                        : "#ffffff",
                      border: "2px solid var(--color-primary)",
                      color: part.completed
                        ? "#ffffff"
                        : "var(--color-primary)",
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    className="chapter-title"
                    sx={{
                      fontSize: 20,
                      color: part.completed
                        ? "var(--color-font-primary)"
                        : "#bbbbbb",
                      fontWeight: part.completed ? 600 : 400,
                    }}
                  >
                    {chapterLabel}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#f5f5f5",
                      border: "2px solid #dddddd",
                      opacity: 0.7,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: 4,
                        color: "#333333",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Box>
                    <LockOutlinedIcon sx={{ fontSize: 22, color: "#bbbbbb" }} />
                  </Box>
                  <Typography sx={{ fontSize: 14, color: "#bbbbbb" }}>
                    この Part はまだ解放されていません
                  </Typography>
                </Box>
              )}

              {/* 一覧アイコン：解放/完了なら list へのリンク、ロック中はグレーで非リンク。 */}
              {part.unlocked || part.completed ? (
                <Box
                  component={NextLink}
                  href={`/basicWord/${parentId}/${part.id}/list`}
                  aria-label={`${chapterLabel}の単語一覧`}
                  sx={{
                    flexShrink: 0,
                    ml: "auto",
                    display: "flex",
                    color: "var(--color-primary)",
                  }}
                >
                  <FormatListBulletedIcon sx={{ fontSize: 18 }} />
                </Box>
              ) : (
                <Box
                  sx={{
                    flexShrink: 0,
                    ml: "auto",
                    display: "flex",
                    color: "#cccccc",
                  }}
                >
                  <FormatListBulletedIcon sx={{ fontSize: 18 }} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
