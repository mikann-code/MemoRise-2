import Box from "@mui/material/Box";

/**
 * ローディングスピナー。36px の円を回転させる（左ボーダーを黒にして回転を可視化）。
 */
export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: "50%",
        marginLeft: "-18px",
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
