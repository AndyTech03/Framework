drop schema if exists notification cascade;
create schema notification;


create table notification.Notification_Type(
	id smallserial not null,
	slug text not null,
	title text not null,
	description text not null,

	primary key (id),
	unique (slug)
);

create table notification.Notification(
	id bigserial not null,
	type_id smallint not null,
	source json not null,
	content json not null,
	notification_date timestamp without time zone not null,

	primary key (id)
);

create table notification.Account_Notification(
	id bigserial not null,
	receiver_aid bigint not null,
	notification_id bigint not null,
	status json not null,

	primary key (id),
	unique (notification_id, receiver_aid)
);

create table notification.Account_Notification_Settings(
	id bigserial not null,
	account_id bigint not null,
	settings json not null,

	primary key (id),
	unique (account_id)
);

