"use client";

import { type ChangeEvent, type FormEvent, use, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/common/ui";
import { useAdminWordbookQuery } from "@/graphql/queries/adminWordbook";
import { useImportCsvMutation } from "@/graphql/mutations/importCsv";
import { useSnackbar } from "@/components/feature/SnackbarProvider";
import AdminPageHeader from "../../../_components/AdminPageHeader";

/**
 * 単語の CSV 一括登録。1 行につき「問題,答え」。ファイル選択または直接貼り付けで入力する。
 * 送信後は登録件数と、失敗した行の行番号付きエラーを一覧表示する（部分成功が分かる）。
 */

type FieldError = { field: string; message: string };

type Props = { params: Promise<{ id: string }> };

export default function ImportCsvPage({ params }: Props) {
  const { id } = use(params);
  const { notify } = useSnackbar();

  const { data } = useAdminWordbookQuery({
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const wordbook = data?.adminWordbook ?? null;

  const [importCsv, { loading }] = useImportCsvMutation();
  const [csv, setCsv] = useState("");
  const [rowErrors, setRowErrors] = useState<FieldError[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRowErrors([]);
    setImportedCount(null);

    if (!csv.trim()) {
      setRowErrors([{ field: "csv", message: "CSV を入力してください" }]);
      return;
    }

    try {
      const { data: result } = await importCsv({ variables: { wordbookId: id, csv } });
      const payload = result?.importCsv;
      if (!payload) {
        setRowErrors([{ field: "system", message: "登録に失敗しました" }]);
        return;
      }
      setImportedCount(payload.importedCount);
      setRowErrors(
        payload.errors.map((er) => ({ field: er.field, message: er.message })),
      );
      if (payload.success) {
        notify(`${payload.importedCount} 件を登録しました`);
        setCsv("");
      }
    } catch {
      setRowErrors([{ field: "system", message: "登録に失敗しました" }]);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader
        title="CSV 一括登録"
        backHref={`/admin/wordbooks/${id}`}
        backLabel={wordbook ? wordbook.title : "戻る"}
      />

      <Typography sx={{ color: "#bbbbbb", fontSize: 14, mb: 2 }}>
        1 行につき「問題,答え」の形式で入力してください。例: <br />
        <Box component="code" sx={{ color: "#ddd" }}>
          apple,りんご
        </Box>
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ mb: 2 }}>
          <Button type="button" size="compact" color="#3b82f6" hoverColor="#2563eb">
            <Box component="label" sx={{ cursor: "pointer", display: "inline-flex" }}>
              ファイルを選択
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={onFile}
                hidden
              />
            </Box>
          </Button>
        </Box>

        <TextField
          multiline
          minRows={8}
          fullWidth
          placeholder={"apple,りんご\nbanana,バナナ"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "登録中..." : "一括登録する"}
        </Button>
      </Box>

      {(importedCount != null || rowErrors.length > 0) && (
        <Box sx={{ mt: 3 }}>
          {importedCount != null && (
            <Typography sx={{ fontSize: 14, mb: 1 }}>
              登録成功：<strong>{importedCount}</strong> 件
              {rowErrors.length > 0 && ` / 失敗：${rowErrors.length} 件`}
            </Typography>
          )}
          {rowErrors.length > 0 && (
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                p: "12px 16px",
                m: 0,
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.4)",
                borderRadius: "10px",
              }}
            >
              {rowErrors.map((er, i) => (
                <Box
                  component="li"
                  key={`${er.field}-${i}`}
                  sx={{ color: "var(--color-error)", fontSize: 13, mb: "4px" }}
                >
                  {er.message}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}
