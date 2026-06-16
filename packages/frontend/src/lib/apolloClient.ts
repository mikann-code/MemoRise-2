import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

/**
 * Apollo Client インスタンスを生成する。
 * 認証スコープ（一般 / 管理者）を分ける場合は、ここを複製して
 * 別 Cookie のトークンを載せる link を用意する（設計は docs/frontend.md 参照）。
 *
 * ※ @apollo/client のバージョンによって import パスが変わることがある。
 *    v4 では React 用 API は "@apollo/client/react" に分離されている。
 */
export function makeApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3100/graphql",
      credentials: "include",
    }),
    cache: new InMemoryCache(),
  });
}
