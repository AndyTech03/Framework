drop schema if exists account cascade;
create schema account;


create table account.Account_State(
	id smallserial not null,
	name text not null,

	primary key (id)
);

create table account.Account_Role(
	id smallserial not null,
	name text not null,

	primary key (id)
);

create table account.Account(
	id bigserial not null,
	state_id smallint not null,
	role_id smallint not null,
	email text not null,
	phone text not null,
	password text not null,
	name text not null,
	second_name text not null,
	last_name text not null,
	birthday timestamp without time zone not null,
	registration_date timestamp without time zone not null default date_trunc('second', now() at time zone 'utc'),

	primary key (id),
	unique (email),
	unique (phone)
);

