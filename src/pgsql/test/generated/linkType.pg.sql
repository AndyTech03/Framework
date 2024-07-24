create or replace function
test.create_link_type(
	_slug text,
	_title text
)
returns table(id smallint)
language plpgsql as $$
declare
	_id smallint;
begin
	_id := nextval(pg_get_serial_sequence('test.Link_Type', 'id'));

	return query insert into test.Link_Type (
		id, slug, title
	) values (
		_id, _slug, _title
	) returning Link_Type.id;
	return;
end;
$$;

create or replace function
test.select_link_type(
	_id smallint
)
returns test.Link_Type
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Link_Type', exists(
			select from test.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Link_Type
		from test.Link_Type
		where
			id = _id
	);
end;
$$;

create or replace procedure
test.update_link_type(
	_id smallint,
	_slug text default null,
	_title text default null,
	_description text default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Link_Type', exists(
			select from test.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update test.Link_Type set
		slug = coalesce(_slug, slug),
		title = coalesce(_title, title),
		description = coalesce(_description, description)
	where
		id = _id;
end;
$$;

create or replace procedure
test.delete_link_type(
	_id smallint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Link_Type', exists(
			select from test.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from test.Link_Type where
		id = _id;
end;
$$;

