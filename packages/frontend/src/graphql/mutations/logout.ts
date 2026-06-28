"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";

/** ログアウト Mutation。サーバーがセッション Cookie を破棄する（冪等）。 */
export const LogoutDocument = graphql(`
  mutation Logout {
    logout {
      success
    }
  }
`);

/** useMutation(LogoutDocument) の薄いラッパー（型は Document から自動推論）。 */
export function useLogoutMutation() {
  return useMutation(LogoutDocument);
}
