"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Button, LoadingSpinner } from "@/components/common/ui";
import { LabelSection } from "@/components/common/card";
import { useAdminWordbooksQuery } from "@/graphql/queries/adminWordbooks";
import { WORDBOOK_LABELS } from "@/constants/wordbookLabels";
import AdminPageHeader from "../_components/AdminPageHeader";

/**
 * 公式単語帳（教材）の管理一覧。一般ユーザーが見る公式単語集一覧（publicWordbooks）と
 * 同じ見た目（ラベルごとのセクション + 本カードの横棚）で並べ、各教材をクリックすると
 * 章・単語の管理へ進む。右上の「＋ 新しい教材」から教材を新規作成する。
 * 管理者は全教材を扱うため、既知ラベルに入らない教材（ラベルなし / 未知）は末尾の「未分類」に受ける。
 */
export default function AdminWordbooksPage() {
  const { data, loading, error } = useAdminWordbooksQuery();
  const wordbooks = data?.adminWordbooks ?? [];

  // セクションとして描画するラベル値。
  const shownLabelValues: string[] = WORDBOOK_LABELS.map((l) => l.value);
  // どの既知セクションにも入らない教材（ラベルなし = null / 未知ラベル）。管理者は全教材を見せる。
  const uncategorized = wordbooks.filter(
    (wb) => !shownLabelValues.includes(wb.label ?? ""),
  );

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader
        title="公式単語帳の管理"
        backHref="/admin"
        backLabel="管理トップ"
        action={
          <Button href="/admin/wordbooks/new" size="compact">
            ＋ 新しい教材
          </Button>
        }
      />

      {loading && !data ? (
        <Box sx={{ position: "relative", minHeight: 160 }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Typography sx={{ color: "var(--color-error)" }}>
          公式単語帳の取得に失敗しました。
        </Typography>
      ) : wordbooks.length === 0 ? (
        <Typography sx={{ color: "var(--color-font-secondary)" }}>
          公式単語帳がありません。「 新しい教材 」から作成してください。
        </Typography>
      ) : (
        <>
          {WORDBOOK_LABELS.map((label) => {
            const items = wordbooks.filter((wb) => wb.label === label.value);
            return (
              <LabelSection
                key={label.value}
                title={label.label}
                items={items}
                hrefFor={(item) => `/admin/wordbooks/${item.id}`}
                emptyText="このカテゴリの公式単語集はまだありません。"
              />
            );
          })}

          {uncategorized.length > 0 && (
            <LabelSection
              title="未分類"
              items={uncategorized}
              hrefFor={(item) => `/admin/wordbooks/${item.id}`}
              barColor="#888888"
            />
          )}
        </>
      )}
    </Container>
  );
}
