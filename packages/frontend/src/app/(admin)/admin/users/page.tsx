"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import SearchIcon from "@mui/icons-material/Search";
import { LoadingContainer } from "@/components/common/ui";
import { useAdminUsersQuery } from "@/graphql/queries/adminUsers";
import { AdminUserSortField, SortOrder } from "@/gql/graphql";
import dayjs from "@/lib/dayjs";
import AdminPageHeader from "../_components/AdminPageHeader";

/**
 * ユーザー一覧（管理者専用）。名前・メールのキーワード検索、単語数・登録日での並び替え
 * （列見出しクリックで昇順/降順トグル）、ページャに対応する。並び替え・検索・件数変更時は
 * 先頭ページに戻す。
 */
export default function AdminUsersPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<AdminUserSortField>(AdminUserSortField.CreatedAt);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);
  const [page, setPage] = useState(0); // 0 始まり（TablePagination 準拠）
  const [perPage, setPerPage] = useState(20);

  // キーワードはデバウンスして、打鍵ごとの再取得を避ける。
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const { data, previousData, loading, error } = useAdminUsersQuery({
    page: page + 1,
    perPage,
    keyword: keyword || null,
    sortBy,
    sortOrder,
  });

  // 再取得中も直前の結果を保持してテーブルのちらつきを防ぐ。
  const result = data?.adminUsers ?? previousData?.adminUsers;
  const users = result?.nodes ?? [];
  const totalCount = result?.totalCount ?? 0;

  const orderDir = sortOrder === SortOrder.Asc ? "asc" : "desc";

  const handleSort = (field: AdminUserSortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc));
    } else {
      setSortBy(field);
      setSortOrder(SortOrder.Desc);
    }
    setPage(0);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <AdminPageHeader title="ユーザー一覧" backHref="/admin" backLabel="管理トップ" />

      <TextField
        fullWidth
        size="small"
        placeholder="名前・メールで検索"
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9aa0a6" }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2, "& .MuiOutlinedInput-root": { background: "#1f1f1f", borderRadius: "10px" } }}
      />

      {error && !result ? (
        <Typography sx={{ color: "var(--color-error)" }}>
          ユーザーの取得に失敗しました。
        </Typography>
      ) : loading && !result ? (
        <LoadingContainer />
      ) : (
        <TableContainer sx={{ background: "#1f1f1f", borderRadius: "14px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>名前</TableCell>
                <TableCell>メール</TableCell>
                <TableCell>ロール</TableCell>
                <TableCell align="right" sortDirection={sortBy === AdminUserSortField.WordsCount ? orderDir : false}>
                  <TableSortLabel
                    active={sortBy === AdminUserSortField.WordsCount}
                    direction={sortBy === AdminUserSortField.WordsCount ? orderDir : "asc"}
                    onClick={() => handleSort(AdminUserSortField.WordsCount)}
                  >
                    単語数
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">streak</TableCell>
                <TableCell sortDirection={sortBy === AdminUserSortField.CreatedAt ? orderDir : false}>
                  <TableSortLabel
                    active={sortBy === AdminUserSortField.CreatedAt}
                    direction={sortBy === AdminUserSortField.CreatedAt ? orderDir : "asc"}
                    onClick={() => handleSort(AdminUserSortField.CreatedAt)}
                  >
                    登録日
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell sx={{ color: "#bbbbbb" }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.role === "admin" ? "管理者" : "一般"}
                      color={u.role === "admin" ? "primary" : "default"}
                      variant={u.role === "admin" ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell align="right">{u.wordsCount}</TableCell>
                  <TableCell align="right">{u.streak}</TableCell>
                  <TableCell sx={{ color: "#bbbbbb" }}>
                    {dayjs(u.createdAt).format("YYYY/MM/DD")}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: "var(--color-font-secondary)" }}>
                    {keyword ? "該当するユーザーがいません。" : "ユーザーがいません。"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => {
              setPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="表示件数"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </TableContainer>
      )}
    </Container>
  );
}
