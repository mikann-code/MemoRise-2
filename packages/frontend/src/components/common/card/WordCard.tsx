"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";

/**
 * 単語カード（多場面で再利用する中核部品）。状態は持たず親が制御する：
 * - テスト中：opened=false（答えを伏せる）
 * - 結果   ：opened=true（答えを開く）
 * - 一覧   ：deletable=true（削除可）
 * 右上にタグアイコン（review で primary 点灯）と、deletable 時のみ削除アイコン（confirm 後に onDelete）。
 */
type Props = {
  question: string;
  answer: string;
  opened: boolean;
  review?: boolean;
  onTagToggle?: () => void;
  onDelete?: () => void;
  deletable?: boolean;
  showTag?: boolean;
};

const cellSx = {
  flex: 1,
  p: "20px",
  fontSize: 20,
  fontWeight: 500,
  fontFamily: "var(--font-primary)",
  color: "var(--color-font-primary)",
  wordBreak: "break-word" as const,
};

export default function WordCard({
  question,
  answer,
  opened,
  review = false,
  onTagToggle,
  onDelete,
  deletable = false,
  showTag = true,
}: Props) {
  const handleDelete = () => {
    if (window.confirm("この単語を削除しますか？")) onDelete?.();
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        backgroundColor: "#1f1f1f",
        border: "1px solid var(--color-border)",
        borderRadius: "14px",
      }}
    >
      <Typography component="div" sx={cellSx}>
        {question}
      </Typography>
      {opened && (
        <Typography
          component="div"
          sx={{ ...cellSx, borderLeft: "1px dashed var(--color-border)" }}
        >
          {answer}
        </Typography>
      )}

      <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex" }}>
        {showTag && (
          <IconButton
            size="small"
            onClick={onTagToggle}
            aria-label="復習タグ"
            sx={{
              color: review ? "var(--color-primary)" : "#777777",
              "&:hover": { color: "var(--color-primary)" },
            }}
          >
            <LocalOfferOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {deletable && (
          <IconButton
            size="small"
            onClick={handleDelete}
            aria-label="削除"
            sx={{
              color: "#777777",
              "&:hover": { color: "var(--color-primary)" },
            }}
          >
            <BackspaceOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
