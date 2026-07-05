"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PermIdentityOutlinedIcon from "@mui/icons-material/PermIdentityOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SectionTitle, Button } from "@/components/common/ui";
import { useCurrentUser } from "@/lib/auth/authContext";
import dayjs from "@/lib/dayjs";

/**
 * マイページ（v1 の UserCard を踏襲）。名前・登録単語数・連続学習日数（streak）・
 * メールアドレスに加え、利用開始日を 1 枚のカードに載せ、プロフィール編集へ導線する。
 * 値はいずれも me（AuthProvider の currentUser）から取る（登録単語数は wordsCount = counter_cache）。
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography sx={{ fontSize: 12, color: "var(--color-font-secondary)" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}
function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        py: 2,
        borderRadius: "12px",
        backgroundColor: "var(--color-bg-tertiary)",
      }}
    >
      <Box sx={{ color: "var(--color-primary)", display: "flex" }}>{icon}</Box>
      <Typography
        sx={{ fontSize: 22, fontWeight: 700, color: "var(--color-primary)" }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "var(--color-font-secondary)" }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function MyPage() {
  const { currentUser } = useCurrentUser();

  return (
    <Box sx={{ py: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <SectionTitle
          icon={<PermIdentityOutlinedIcon />}
          subTitle="My Page"
          title="マイページ"
        />
        <Button href="/my-page/edit" size="compact">
          プロフィール編集
        </Button>
      </Box>

      <Box
        sx={{
          mt: 2.5,
          p: 3,
          border: "2px solid var(--color-border)",
          borderRadius: "16px",
        }}
      >
        {/* 統計：登録単語数 / 連続記録 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.5,
          }}
        >
          <StatTile
            icon={<MenuBookOutlinedIcon />}
            value={currentUser.wordsCount}
            label="登録単語"
          />
          <StatTile
            icon={<LocalFireDepartmentIcon />}
            value={currentUser.streak}
            label="連続記録"
          />
        </Box>

        {/* 名前 */}
        <Box sx={{ mt: 2.5 }}>
          <Typography
            sx={{ fontSize: 12, color: "var(--color-font-secondary)" }}
          >
            名前
          </Typography>
          <Typography sx={{ fontSize: 14, mt: 0.5, fontWeight: 700 }}>
            {currentUser.name}
          </Typography>
        </Box>

        {/* メールアドレス */}
        <InfoRow label="メールアドレス" value={currentUser.email} />

        {/* 利用開始日 */}
        <InfoRow
          label="利用開始日"
          value={dayjs(currentUser.createdAt).format("YYYY年 M月 D日")}
        />
      </Box>
    </Box>
  );
}
