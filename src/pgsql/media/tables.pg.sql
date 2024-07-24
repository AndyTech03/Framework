drop schema if exists media cascade;
create schema media;


create table media.Test(
	id bigserial not null,
	id1 serial not null,
	id2 smallserial not null,
	id3 integer not null,
	id4 integer not null default 1,
	id5 serial not null default 1,

	primary key (id, id1, id2, id3, id4, id5)
);

create table media.Link_Type(
	id smallserial not null,
	slug text not null,
	title text not null,
	description text not null default 'Test',

	primary key (id),
	unique (slug)
);

create table media.Hiper_Link(
	id integer not null,
	type_id integer not null,
	link_url text not null,
	extra_data json not null,

	primary key (id)
);

