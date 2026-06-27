import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

/**
 * 共通ヘッダー。アプリ名とナビゲーション枠の土台。
 * TODO(design): ロゴ・ナビ項目・ログイン導線を共有予定のデザインに合わせて確定する。
 */
export default function Header() {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="span" color="primary" fontWeight={700}>
          MemoRise
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
}
