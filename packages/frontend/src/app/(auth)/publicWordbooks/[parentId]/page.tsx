"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { SectionTitle, LoadingContainer, Button } from "@/components/common/ui";
import { usePublicWordbookQuery } from "@/graphql/queries/publicWordbook";
import { useWordbookProgressesQuery } from "@/graphql/queries/wordbookProgresses";

/**
 * 公式単語帳の親 1 件（教材トップ）。子＝章（Part）を縦に並べ、番号バッジ・進捗バー・解放状態で見せる。
 * v1（memorize）の公式単語帳の教材トップを踏襲。解放/完了はバックエンド保存（wordbookProgresses）から
 * 算出する：進捗レコードが存在する章＝解放済み、completed＝テスト完了。先頭章は取得時にサーバーが
 * 遅延作成し、章の完了で次章が解放される（completeWordbookProgress）。
 */
export default function PublicWordbookParentPage() {
  const { parentId } = useParams<{ parentId: string }>();
  const { data, loading, error } = usePublicWordbookQuery({
    variables: { id: parentId },
  });
  const { data: progressData, loading: progressLoading } =
    useWordbookProgressesQuery({ variables: { wordbookId: parentId } });

  const wordbook = data?.publicWordbook ?? null;
  // 章（子単語帳）ID → completed。キーの存在が「解放済み」を表す。
  const progressByChapterId = new Map(
    (progressData?.wordbookProgresses ?? []).map((p) => [p.wordbookId, p.completed]),
  );

  if (loading || progressLoading) {
    return (
      <LoadingContainer />
    );
  }

  if (error || !wordbook || wordbook.children.length === 0) {
    return (
      <Box>
        <Typography component="h2" sx={{ fontSize: 20, mb: 1 }}>
          教材が見つかりません
        </Typography>
        <Typography sx={{ color: "var(--color-font-secondary)", mb: 2 }}>
          この教材の単語データがありません。
        </Typography>
        <Box
          component={NextLink}
          href="/publicWordbooks"
          sx={{ color: "var(--color-primary)" }}
        >
          一覧へ戻る
        </Box>
      </Box>
    );
  }

  const children = wordbook.children;
  // 解放判定：進捗レコードが存在する章＝解放済み（先頭章はサーバーが遅延作成、次章は完了で解放）。
  const parts = children.map((child) => ({
    ...child,
    completed: progressByChapterId.get(child.id) === true,
    unlocked: progressByChapterId.has(child.id),
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
        テストを完了すると、次の Part が順番に解放されていきます。
      </Typography>

      {startPart && (
        <Button href={`/publicWordbooks/${parentId}/${startPart.id}/test`}>
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
          // 章番号は持たず、order_index 昇順の並び位置から「第○章」を導出する
          const chapterLabel = `第${index + 1}章`;

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
                  href={`/publicWordbooks/${parentId}/${part.id}/test`}
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
                  href={`/publicWordbooks/${parentId}/${part.id}/list`}
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
