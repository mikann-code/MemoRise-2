import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ja";

/**
 * dayjs の共通設定（v1 の src/lib/dayjs を踏襲）。
 * 「◯日前」表示（fromNow）用に relativeTime + 日本語ロケールを有効化して export する。
 * 相対表示を使う画面は素の dayjs ではなく必ずこちらを import する。
 */
dayjs.extend(relativeTime);
dayjs.locale("ja");

export default dayjs;
