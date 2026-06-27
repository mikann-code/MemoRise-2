import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
  ADMIN_TOKEN_COOKIE,
  USER_TOKEN_COOKIE,
  readTokenFromBrowser,
} from "@/lib/auth/cookies";

/**
 * Apollo Client を一般用 / 管理者用で分離する（docs/frontend.md「6. 認証・通信」）。
 * - 認証スコープごとに別 Cookie のトークンを Authorization ヘッダへ載せる（authLink）。
 * - InMemoryCache をインスタンスごとに分け、キャッシュ空間を分離して汚染を防ぐ
 *   （v1 の ["me"] / ["adminMe"] キー分離に相当）。
 *
 * ※ @apollo/client v4 では React 用 API は "@apollo/client/react" に分離されている。
 */
const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3100/graphql";

/** 指定 Cookie のトークンを Authorization ヘッダへ載せる auth link を作る。 */
function makeAuthLink(cookieName: string): ApolloLink {
  return setContext((_, { headers }) => {
    const token = readTokenFromBrowser(cookieName);
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });
}

function makeHttpLink(): HttpLink {
  return new HttpLink({ uri: GRAPHQL_URL, credentials: "include" });
}

/** 一般ユーザー用 Apollo Client。user_token を載せ、専用キャッシュ空間を持つ。 */
export function makeUserApolloClient(): ApolloClient {
  return new ApolloClient({
    link: ApolloLink.from([makeAuthLink(USER_TOKEN_COOKIE), makeHttpLink()]),
    cache: new InMemoryCache(),
  });
}

/** 管理者用 Apollo Client。admin_token を載せ、一般用とは別のキャッシュ空間を持つ。 */
export function makeAdminApolloClient(): ApolloClient {
  return new ApolloClient({
    link: ApolloLink.from([makeAuthLink(ADMIN_TOKEN_COOKIE), makeHttpLink()]),
    cache: new InMemoryCache(),
  });
}
