-- Spec 012: objetivo do hábito, texto livre e opcional (nulo = sem objetivo)
alter table habits add column objective varchar(60);
