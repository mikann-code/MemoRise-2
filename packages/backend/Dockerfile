# 開発用 Dockerfile（Rails API サーバー）
FROM ruby:3.4.5-bookworm

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential libpq-dev postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Gemfile.lock は初回 bundle install で生成される
COPY Gemfile ./
RUN bundle install

COPY . .

RUN mkdir -p tmp/pids

EXPOSE 3100

CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3100"]
