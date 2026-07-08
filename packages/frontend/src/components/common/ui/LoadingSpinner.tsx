import Box from "@mui/material/Box";

/**
 * ローディングスピナー。36px の円を回転させる（左ボーダーを黒にして回転を可視化）。
 * 画面（ビューポート）のど真ん中に固定表示する。
 */
export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        margin: "auto",
        zIndex: 1300,
        width: 36,
        height: 36,
        border: "4px solid var(--color-border)",
        borderLeftColor: "#000000",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          to: { transform: "rotate(360deg)" },
        },
      }}
    />
  );
}
