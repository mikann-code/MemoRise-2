"use client";

import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

/**
 * 正誤判定ボタン（正解=緑 / 不正解=赤）。Button 系と同じ立体表現。
 * 「答えを見る」まで disabled にして UI 制約でチートを物理的に防止する想定。
 */
const judgeBase = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 0",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 500,
  fontFamily: "var(--font-secondary)",
  transition: "all .1s ease",
  "&:disabled": {
    backgroundColor: "#888888",
    boxShadow: "none",
    cursor: "not-allowed",
  },
};

const CorrectButton = styled("button")({
  ...judgeBase,
  backgroundColor: "#4caf50",
  boxShadow: "0 4px 0 #1e4620",
  "&:not(:disabled):hover": {
    transform: "translateY(2px)",
    boxShadow: "0 1px 0 #1e4620",
  },
});

const WrongButton = styled("button")({
  ...judgeBase,
  backgroundColor: "#f44336",
  boxShadow: "0 4px 0 #611a15",
  "&:not(:disabled):hover": {
    transform: "translateY(2px)",
    boxShadow: "0 1px 0 #611a15",
  },
});

type Props = {
  onCorrect: () => void;
  onWrong: () => void;
  disabled?: boolean;
};

export default function JudgeButtons({
  onCorrect,
  onWrong,
  disabled = false,
}: Props) {
  return (
    <Box sx={{ display: "flex", gap: "10px" }}>
      <CorrectButton type="button" onClick={onCorrect} disabled={disabled}>
        <CheckIcon fontSize="small" />
        正解
      </CorrectButton>
      <WrongButton type="button" onClick={onWrong} disabled={disabled}>
        <CloseIcon fontSize="small" />
        不正解
      </WrongButton>
    </Box>
  );
}
