"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 単語カード（多場面で再利用する中核部品）。状態は持たず親が制御する：
 * - テスト中：opened=false（答えを伏せる）
 * - 結果   ：opened=true（答えを開く）
 * - 一覧   ：deletable=true（削除可）
 * 右上にタグアイコン（review で primary 点灯）と、onEdit 指定時は編集アイコン、
 * deletable 時のみ削除アイコン（スナックバー確認後に onDelete）。
 * 768px 以下ではアイコン群を「…」1 個に集約しメニューから操作する
 * （単語・意味のテキストは省略せず折り返して全文を保つ）。
 */
type Props = {
  question: string;
  answer: string;
  opened: boolean;
  review?: boolean;
  onTagToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deletable?: boolean;
  showTag?: boolean;
};

const MOBILE = "@media (max-width: 768px)";

const cellSx = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  p: "20px",
  fontSize: 20,
  fontWeight: 500,
  fontFamily: "var(--font-primary)",
  color: "var(--color-font-primary)",
  wordBreak: "break-word" as const,
};

// カードは q / a の 2 セル flex を基本とし、アイコン行（small IconButton ≒ 30px
// + top: 8px）の分だけ両セルの padding を上下対称（py）に空け、上側の領域に
// アイコンを置く。テキストはアイコンと重ならず、セル中央に収まる。
const iconAreaSx = { py: "36px" };

export default function WordCard({
  question,
  answer,
  opened,
  review = false,
  onTagToggle,
  onEdit,
  onDelete,
  deletable = false,
  showTag = true,
}: Props) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const closeMenu = () => setMenuAnchor(null);
  const { confirm } = useSnackbar();

  const handleDelete = async () => {
    if (await confirm("この単語を削除しますか？")) onDelete?.();
  };

  const hasActions = showTag || !!onEdit || deletable;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        backgroundColor: "#1f1f1f",
        // 復習登録済みの単語はオレンジ枠で強調する
        border: review
          ? "1px solid var(--color-primary)"
          : "1px solid var(--color-border)",
        borderRadius: "14px",
      }}
    >
      <Typography component="div" sx={[cellSx, hasActions && iconAreaSx]}>
        {question}
      </Typography>
      {opened && (
        <Typography
          component="div"
          sx={[
            cellSx,
            hasActions && iconAreaSx,
            { borderLeft: "1px dashed var(--color-border)" },
          ]}
        >
          {answer}
        </Typography>
      )}

      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          [MOBILE]: { display: "none" },
        }}
      >
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
        {onEdit && (
          <IconButton
            size="small"
            onClick={onEdit}
            aria-label="編集"
            sx={{
              color: "#777777",
              "&:hover": { color: "var(--color-primary)" },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
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

      {hasActions && (
        <>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="操作メニュー"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "none",
              color: "#777777",
              "&:hover": { color: "var(--color-primary)" },
              [MOBILE]: { display: "inline-flex" },
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
          >
            {showTag && (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  onTagToggle?.();
                }}
              >
                <ListItemIcon>
                  <LocalOfferOutlinedIcon
                    fontSize="small"
                    sx={{ color: review ? "var(--color-primary)" : undefined }}
                  />
                </ListItemIcon>
                <ListItemText>
                  {review ? "復習タグを外す" : "復習タグを付ける"}
                </ListItemText>
              </MenuItem>
            )}
            {onEdit && (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  onEdit();
                }}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>編集</ListItemText>
              </MenuItem>
            )}
            {deletable && (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  handleDelete();
                }}
              >
                <ListItemIcon>
                  <BackspaceOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>削除</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  );
}
