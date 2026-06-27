import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@/components/common/ui/Button";
import ButtonSecondary from "@/components/common/ui/ButtonSecondary";

/**
 * エラー / 空状態カード。本文 + 主アクション（+任意で従アクション）を宣言的に表示する。
 * 未ログイン・通信失敗時のリッチな空状態（ログイン / 新規登録への導線）に使う。
 */
type Props = {
  text: ReactNode;
  buttonLabel: string;
  href: string;
  secondaryButtonLabel?: string;
  secondaryHref?: string;
};

export default function ErrorCard({
  text,
  buttonLabel,
  href,
  secondaryButtonLabel,
  secondaryHref,
}: Props) {
  const hasSecondary = Boolean(secondaryButtonLabel && secondaryHref);

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        p: "52px 30px",
        backgroundColor: "#1a1a1a",
        border: "1px solid #444444",
        borderRadius: "14px",
        textAlign: "center",
      }}
    >
      <Typography
        component="div"
        sx={{
          whiteSpace: "pre-line",
          color: "var(--color-font-primary)",
          mb: 4,
        }}
      >
        {text}
      </Typography>
      <Box
        sx={{
          width: 500,
          maxWidth: "100%",
          mx: "auto",
          display: "flex",
          gap: 2,
          "@media (max-width:768px)": { flexDirection: "column", width: 200 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Button href={href}>{buttonLabel}</Button>
        </Box>
        {hasSecondary && (
          <Box sx={{ flex: 1 }}>
            <ButtonSecondary href={secondaryHref}>
              {secondaryButtonLabel}
            </ButtonSecondary>
          </Box>
        )}
      </Box>
    </Box>
  );
}
