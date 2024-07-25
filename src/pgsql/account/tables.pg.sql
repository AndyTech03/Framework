drop schema if exists account cascade;
create schema account;


create table account.Account(
	id bigserial not null,

	primary key (id)
);

