-- Notificações (spec 011). Só tabelas novas: nenhuma tabela existente muda.

-- Preferências da conta: criadas na primeira ativação (plan P5). Sem linha = nunca ativou.
create table notification_settings (
    user_id         bigint  primary key references users (id) on delete cascade,
    reminder_time   time    not null default '20:00',
    daily_enabled   boolean not null default true,
    at_risk_enabled boolean not null default true,
    summary_enabled boolean not null default true,
    -- Último lembrete diário OU resumo de domingo enviado (no máximo um por dia, RF-010)
    last_daily_on   date,
    last_at_risk_on date
);

-- Um aparelho com notificações ativas = uma inscrição de push (plan P4)
create table push_subscriptions (
    id         bigserial     primary key,
    user_id    bigint        not null references users (id) on delete cascade,
    endpoint   varchar(1024) not null unique,
    p256dh     varchar(100)  not null,
    auth       varchar(40)   not null,
    created_at timestamptz   not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);
