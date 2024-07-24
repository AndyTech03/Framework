create or replace function
media.create_hiper_link(
	_id integer,
	_type_id integer,
	_link_url text,
	_extra_data json
)
returns table(id integer)
language plpgsql as $$
begin
	return query insert into media.Hiper_Link (
		id, type_id, link_url, extra_data
	) values (
		_id, _type_id, _link_url, _extra_data
	) returning Hiper_Link.id;
	return;
end;
$$;

create or replace function
media.select_hiper_link(
	_id integer
)
returns media.Hiper_Link
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Hiper_Link', exists(
			select from media.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select *
		from media.Hiper_Link
		where
			id = _id
	);
end;
$$;

create or replace procedure
media.update_hiper_link(
	_id integer,
	_type_id integer default null,
	_link_url text default null,
	_extra_data json default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Hiper_Link', exists(
			select from media.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update media.Hiper_Link set
		type_id = coalesce(_type_id, type_id),
		link_url = coalesce(_link_url, link_url),
		extra_data = coalesce(_extra_data, extra_data)
	where
		id = _id;
end;
$$;

create or replace procedure
media.delete_hiper_link(
	_id integer
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Hiper_Link', exists(
			select from media.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from media.Hiper_Link where
		id = _id;
end;
$$;

