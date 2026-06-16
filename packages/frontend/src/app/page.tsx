import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" component="h1" fontWeight={700} color="primary">
          MemoRise v2
        </Typography>
        <Typography variant="body1" color="text.secondary">
          セットアップ完了。ここから画面を実装していきます。
        </Typography>
        <Button variant="contained" size="large">
          はじめる
        </Button>
      </Box>
    </Container>
  );
}
