create or replace function
test.create_hiper_link(
	_id integer,
	_type_id integer,
	_link_url text,
	_extra_data json
)
returns table(id integer)
language plpgsql as $$
begin
	return query insert into test.Hiper_Link (
		id, type_id, link_url, extra_data
	) values (
		_id, _type_id, _link_url, _extra_data
	) returning Hiper_Link.id;
	return;
end;
$$;

create or replace function
test.select_hiper_link(
	_id integer
)
returns test.Hiper_Link
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Hiper_Link', exists(
			select from test.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Hiper_Link
		from test.Hiper_Link
		where
			id = _id
	);
end;
$$;

create or replace procedure
test.update_hiper_link(
	_id integer,
	_type_id integer default null,
	_link_url text default null,
	_extra_data json default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Hiper_Link', exists(
			select from test.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update test.Hiper_Link set
		type_id = coalesce(_type_id, type_id),
		link_url = coalesce(_link_url, link_url),
		extra_data = coalesce(_extra_data, extra_data)
	where
		id = _id;
end;
$$;

create or replace procedure
test.delete_hiper_link(
	_id integer
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Hiper_Link', exists(
			select from test.Hiper_Link
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from test.Hiper_Link where
		id = _id;
end;
$$;

