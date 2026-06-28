import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

/**
 * Apollo Client を一般用 / 管理者用で分離する（docs/frontend.md「6. 認証・通信」）。
 * 認証は DB セッション方式：HttpLink を `credentials: "include"` にして
 * セッション Cookie（_memorise_session）を毎リクエスト送る（トークンの手動付与は不要）。
 * InMemoryCache はインスタンスごとに分け、一般／管理者でキャッシュ空間を分離して汚染を防ぐ
 * （v1 の ["me"] / ["adminMe"] キー分離に相当）。
 *
 * ※ @apollo/client v4 では React 用 API は "@apollo/client/react" に分離されている。
 */
const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3100/graphql";

function makeHttpLink(): HttpLink {
  return new HttpLink({ uri: GRAPHQL_URL, credentials: "include" });
}

/** 一般ユーザー用 Apollo Client。専用のキャッシュ空間を持つ。 */
export function makeUserApolloClient(): ApolloClient {
  return new ApolloClient({
    link: makeHttpLink(),
    cache: new InMemoryCache(),
  });
}

/** 管理者用 Apollo Client。一般用とは別のキャッシュ空間を持つ。 */
export function makeAdminApolloClient(): ApolloClient {
  return new ApolloClient({
    link: makeHttpLink(),
    cache: new InMemoryCache(),
  });
}
