create table users (
    id            bigserial primary key,
    name          varchar(100) not null,
    -- gravado já normalizado (sem espaços nas pontas e em minúsculas)
    email         varchar(254) not null unique,
    password_hash varchar(100) not null,
    week_mode     varchar(10)  not null default 'rolling' check (week_mode in ('rolling', 'calendar')),
    created_at    timestamptz  not null default now()
);

create table habits (
    id         bigserial primary key,
    user_id    bigint      not null references users (id) on delete cascade,
    name       varchar(30) not null,
    emoji      varchar(32) not null default '',
    archived   boolean     not null default false,
    sort_order int         not null,
    created_at timestamptz not null default now()
);

-- Nomes únicos por usuário, sem diferenciar maiúsculas/minúsculas (ativos e arquivados)
create unique index habits_user_name_uk on habits (user_id, lower(name));
create index habits_user_idx on habits (user_id);

create table checks (
    habit_id bigint not null references habits (id) on delete cascade,
    day      date   not null,
    primary key (habit_id, day)
);
