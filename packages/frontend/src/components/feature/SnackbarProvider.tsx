"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

/**
 * window.confirm / window.alert の代替となる自作 UI。
 * - confirm(message): 画面全体を暗くして中央にメッセージ + OK / キャンセルを表示し
 *   Promise<boolean> を返す（オーバーレイのクリックはキャンセル扱い）
 * - notify(message) : 下部（Footer の上）に下からスライドインで表示し、
 *   一定時間後にフェードアウトして自動で消える
 * 確認中に別の confirm が呼ばれた場合、先の確認はキャンセル（false）扱いで置き換える。
 */

type SnackbarContextValue = {
  confirm: (message: string) => Promise<boolean>;
  notify: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar は SnackbarProvider の配下で使ってください");
  }
  return ctx;
}

type ConfirmState = {
  message: string;
  resolve: (ok: boolean) => void;
};

const NOTIFY_DURATION_MS = 2000;
const NOTIFY_EXIT_MS = 200;

const overlaySx = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1400,
  backgroundColor: "rgba(0,0,0,.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dialogSx = {
  minWidth: 360,
  maxWidth: "calc(100vw - 40px)",
  backgroundColor: "#1f1f1f",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,.5)",
  p: "28px 32px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "24px",
};

const barSx = {
  position: "fixed" as const,
  left: "50%",
  bottom: "96px", // Footer（bottom: 2 + 高さ約 80px）の上
  zIndex: 1400,
  maxWidth: "calc(100vw - 40px)",
  backgroundColor: "#1f1f1f",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,.5)",
  p: "12px 16px",
  "@keyframes notify-in": {
    from: { opacity: 0, transform: "translate(-50%, 24px)" },
    to: { opacity: 1, transform: "translate(-50%, 0)" },
  },
  "@keyframes notify-out": {
    from: { opacity: 1, transform: "translate(-50%, 0)" },
    to: { opacity: 0, transform: "translate(-50%, 12px)" },
  },
};

const messageSx = {
  fontSize: 16,
  color: "var(--color-font-primary)",
  whiteSpace: "pre-line" as const,
};

export default function SnackbarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmRef = useRef<ConfirmState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // true の間は退場アニメーション中。終了（onAnimationEnd）で DOM から外す。
  const [noticeLeaving, setNoticeLeaving] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useCallback((message: string) => {
    confirmRef.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      const state = { message, resolve };
      confirmRef.current = state;
      setConfirmState(state);
    });
  }, []);

  const settleConfirm = (ok: boolean) => {
    confirmRef.current?.resolve(ok);
    confirmRef.current = null;
    setConfirmState(null);
  };

  const notify = useCallback((message: string) => {
    setNotice(message);
    setNoticeLeaving(false);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(
      () => setNoticeLeaving(true),
      NOTIFY_DURATION_MS,
    );
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  return (
    <SnackbarContext.Provider value={{ confirm, notify }}>
      {children}

      {confirmState && (
        <Box sx={overlaySx} onClick={() => settleConfirm(false)}>
          <Box
            sx={dialogSx}
            role="alertdialog"
            aria-label={confirmState.message}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography sx={messageSx}>{confirmState.message}</Typography>
            <Box sx={{ display: "flex", gap: "8px", width: "100%" }}>
              <ButtonBase
                onClick={() => settleConfirm(false)}
                sx={{
                  flex: 1,
                  p: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-font-secondary)",
                  fontSize: 14,
                  "&:hover": { borderColor: "var(--color-font-secondary)" },
                }}
              >
                キャンセル
              </ButtonBase>
              <ButtonBase
                onClick={() => settleConfirm(true)}
                sx={{
                  flex: 1,
                  p: "10px 16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-primary)",
                  color: "#000000",
                  fontSize: 14,
                  fontWeight: 600,
                  "&:hover": { opacity: 0.85 },
                }}
              >
                OK
              </ButtonBase>
            </Box>
          </Box>
        </Box>
      )}

      {!confirmState && notice && (
        <Box
          sx={{
            ...barSx,
            animation: noticeLeaving
              ? `notify-out ${NOTIFY_EXIT_MS}ms ease-in forwards`
              : "notify-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
          role="status"
          onAnimationEnd={() => {
            if (noticeLeaving) {
              setNotice(null);
              setNoticeLeaving(false);
            }
          }}
        >
          <Typography sx={messageSx}>{notice}</Typography>
        </Box>
      )}
    </SnackbarContext.Provider>
  );
}
