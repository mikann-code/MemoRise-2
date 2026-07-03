"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { SectionTitle } from "@/components/common/ui";
import { useMeQuery } from "@/graphql/queries/me";

/**
 * オリジナル単語帳（ホーム）。「作成する」「テストする」の 2 タイル。
 * localStorage の lastWordbookUuid で最後に使った単語帳へ直行（無ければ /wordbooks）。
 * 未ログイン時も /wordbooks へ誘導（v1 踏襲）。
 */

const tile = {
  position: "relative",
  width: "100%",
  height: 200,
  fontFamily: "var(--font-primary)",
  border: "2px solid var(--color-border)",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 2.5,
  cursor: "pointer",
  "& .craft-img": { transition: "transform .3s ease" },
  "&:hover .craft-img": { transform: "scale(1.08)" },
  "&:hover .craft-label": { background: "rgba(255,255,255,0.18)" },
  "@media (max-width:940px)": {
    height: 160,
    "& .craft-img": { width: 140, height: "auto" },
  },
};

const tileLabel = {
  position: "absolute",
  top: 12,
  left: 12,
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  px: 1.5,
  py: 0.75,
  borderRadius: "999px",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.02em",
  transition: "background .2s ease",
};

export default function CraftWord() {
  const router = useRouter();
  const { data: meData } = useMeQuery({ errorPolicy: "all" });
  const user = meData?.me ?? null;

  const go = (suffix: "list" | "test") => {
    if (!user) {
      router.push("/wordbooks");
      return;
    }
    const uuid =
      typeof window !== "undefined"
        ? localStorage.getItem("lastWordbookUuid")
        : null;
    router.push(uuid ? `/wordbooks/${uuid}/${suffix}` : "/wordbooks");
  };

  const tiles = [
    { label: "作成する", src: "/images/icon-creative.svg", size: 180, go: () => go("list") },
    { label: "テストする", src: "/images/icon-practice.svg", size: 200, go: () => go("test") },
  ];

  return (
    <Box>
      <SectionTitle
        icon={<EditOutlinedIcon />}
        subTitle="Create & Learn"
        title="オリジナル単語帳"
      />

      <Box
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          mt: 2.5,
          "@media (max-width:768px)": { flexDirection: "column" },
        }}
      >
        {tiles.map((t) => (
          <Box key={t.label} onClick={t.go} sx={tile}>
            <Typography className="craft-label" sx={tileLabel}>
              {t.label}
            </Typography>
            <Image
              src={t.src}
              width={t.size}
              height={t.size}
              alt={t.label}
              className="craft-img"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
