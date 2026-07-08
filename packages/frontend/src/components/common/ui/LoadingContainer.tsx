import Box from "@mui/material/Box";
import LoadingSpinner from "./LoadingSpinner";
import { LOADING_MIN_HEIGHT } from "@/constants/ui";

/**
 * ローディング中のプレースホルダ。`LoadingSpinner`（ビューポート中央に固定表示）を包み、
 * 読み込み中に高さが潰れないよう最小高さを予約する。各ページで直書きされていた
 * `<Box sx={{ position:"relative", minHeight:N }}><LoadingSpinner /></Box>` を統一したもの。
 */
export default function LoadingContainer() {
  return (
    <Box sx={{ position: "relative", minHeight: LOADING_MIN_HEIGHT }}>
      <LoadingSpinner />
    </Box>
  );
}
