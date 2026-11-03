-- Histórico de metas semanais (spec 006): cada linha vale a partir de valid_from
create table habit_goals (
    habit_id      bigint not null references habits (id) on delete cascade,
    valid_from    date   not null,
    -- null = hábito sem meta a partir desta data
    days_per_week int    check (days_per_week between 1 and 7),
    primary key (habit_id, valid_from)
);
