# 開発時のみ動作する GraphiQL。API モード（Sprockets なし）のため、
# graphiql-rails エンジンは使わず CDN から読み込む軽量版を返す。
# routes.rb で development 環境に限定してマウントしている。
class GraphiqlController < ApplicationController
  def show
    render html: GRAPHIQL_HTML.html_safe
  end

  GRAPHIQL_HTML = <<~HTML.freeze
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MemoRise GraphiQL</title>
        <style>
          body { margin: 0; }
          #graphiql { height: 100dvh; }
        </style>
        <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
      </head>
      <body>
        <div id="graphiql">Loading GraphiQL...</div>
        <!-- UMD グローバル（GraphiQL.createFetcher）が使える v3 系に固定する。
             react / graphiql を無指定にすると最新メジャー（v19 / v4・v5）になり、
             UMD ビルドが無く読み込みに失敗するため必ずバージョンを固定すること。 -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
        <script>
          const fetcher = GraphiQL.createFetcher({ url: window.location.origin + "/graphql" });
          const root = ReactDOM.createRoot(document.getElementById("graphiql"));
          root.render(React.createElement(GraphiQL, { fetcher: fetcher, defaultEditorToolsVisibility: true }));
        </script>
      </body>
    </html>
  HTML
end
