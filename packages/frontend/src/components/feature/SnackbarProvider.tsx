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
import { ANIM_EASE_OUT, ANIM_ENTER_MS, NOTIFY_DURATION_MS } from "@/constants/ui";

/**
 * window.confirm / window.alert の代替となる自作 UI。
 * - confirm(message): 画面全体を暗くして中央にメッセージ + OK / キャンセルを表示し
 *   Promise<boolean> を返す（オーバーレイのクリックはキャンセル扱い）
 * - notify(message) : confirm と同じ画面中央に表示し、一定時間後に自動で消える
 *   （暗転はしない＝操作をブロックしない非モーダル通知）
 * どちらも同じ動き（下からスライドイン → 下に沈みながらフェードアウト）で出入りする。
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

const ENTER_ANIMATION = `${ANIM_ENTER_MS}ms ${ANIM_EASE_OUT} both`;
const EXIT_ANIMATION_MS = 200;

const overlaySx = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1400,
  backgroundColor: "rgba(0,0,0,.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "@keyframes overlay-in": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  "@keyframes overlay-out": {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
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
  "@keyframes dialog-in": {
    from: { opacity: 0, transform: "translateY(24px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@keyframes dialog-out": {
    from: { opacity: 1, transform: "translateY(0)" },
    to: { opacity: 0, transform: "translateY(12px)" },
  },
};

// confirm のダイアログと同じ画面中央に出す（暗転は付けない非モーダル通知）。
// 中央寄せは translate(-50%, -50%) で行い、入退場アニメーションはその分をオフセットする。
const barSx = {
  position: "fixed" as const,
  left: "50%",
  top: "50%",
  zIndex: 1400,
  minWidth: 360,
  maxWidth: "calc(100vw - 40px)",
  backgroundColor: "#1f1f1f",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,.5)",
  p: "28px 32px",
  textAlign: "center" as const,
  "@keyframes notify-in": {
    from: { opacity: 0, transform: "translate(-50%, calc(-50% + 24px))" },
    to: { opacity: 1, transform: "translate(-50%, -50%)" },
  },
  "@keyframes notify-out": {
    from: { opacity: 1, transform: "translate(-50%, -50%)" },
    to: { opacity: 0, transform: "translate(-50%, calc(-50% + 12px))" },
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
  // true の間は確認ダイアログの退場アニメーション中（結果は解決済み）。
  const [confirmLeaving, setConfirmLeaving] = useState(false);
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
      setConfirmLeaving(false);
    });
  }, []);

  // 結果は即座に resolve し、ダイアログは退場アニメーション後に DOM から外す。
  const settleConfirm = (ok: boolean) => {
    if (confirmLeaving) return;
    confirmRef.current?.resolve(ok);
    confirmRef.current = null;
    setConfirmLeaving(true);
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
        <Box
          sx={{
            ...overlaySx,
            animation: confirmLeaving
              ? `overlay-out ${EXIT_ANIMATION_MS}ms ease-in forwards`
              : "overlay-in 200ms ease-out both",
          }}
          onClick={() => settleConfirm(false)}
          onAnimationEnd={() => {
            if (confirmLeaving) {
              setConfirmState(null);
              setConfirmLeaving(false);
            }
          }}
        >
          <Box
            sx={{
              ...dialogSx,
              animation: confirmLeaving
                ? `dialog-out ${EXIT_ANIMATION_MS}ms ease-in forwards`
                : `dialog-in ${ENTER_ANIMATION}`,
            }}
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
              ? `notify-out ${EXIT_ANIMATION_MS}ms ease-in forwards`
              : `notify-in ${ENTER_ANIMATION}`,
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
