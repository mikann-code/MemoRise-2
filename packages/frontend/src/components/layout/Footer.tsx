import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * 共通フッター。
 * TODO(design): リンク・著作権表記などを共有予定のデザインに合わせて確定する。
 */
export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        © MemoRise
      </Typography>
    </Box>
  );
}
